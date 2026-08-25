import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase-public';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { SITE_URL } from '@/lib/site';
import { fetchExplorarCatalogData } from '@/lib/data/catalog';

function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

function updateLatestDate(map: Map<string, Date>, key: string, value?: string | null) {
  if (!key || !value) return;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return;

  const current = map.get(key);
  if (!current || date.getTime() > current.getTime()) {
    map.set(key, date);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/explorar`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pregunteros`,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/pricing`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terminos`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/copyright`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidad`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/landings/parciales`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/landings/resumenes`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const client = createPublicClient();
  const fetchAllQuestionFreshness = async () => {
    const pageSize = 1000;
    const rows: Array<{
      materia_id: string | null;
      parcial: number | null;
      creado_at: string | null;
    }> = [];

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await client
        .from('preguntas_banco_public')
        .select('materia_id, parcial, creado_at')
        .range(from, from + pageSize - 1);

      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }

    return { data: rows };
  };
  const [
    universidadesResult,
    materiasResult,
    explorarDataResult,
    frescuraResult,
    resumenesResult,
    recursosResult,
  ] = await Promise.allSettled([
    client.from('universidades').select('id'),
    client.from('materias').select('id, nombre'),
    fetchExplorarCatalogData(client),
    fetchAllQuestionFreshness(),
    client.from('resumenes').select('materia_id, created_at').limit(10000),
    client.from('recursos').select('materia_id, creado_at').limit(10000),
  ]);

  const materiaPageLastModified = new Map<string, Date>();
  const pregunteroLastModified = new Map<string, Date>();
  const resumenLastModified = new Map<string, Date>();
  const parcialLastModified = new Map<string, Date>();
  const materiasConPreguntas = new Set<string>();
  const parcialesConPreguntas = new Set<string>();

  if (isFulfilled(frescuraResult)) {
    for (const row of frescuraResult.value.data ?? []) {
      const materiaId = String(row.materia_id ?? '');
      if (!materiaId) continue;

      const parcialKey = `${materiaId}:${Number(row.parcial ?? 1)}`;
      materiasConPreguntas.add(materiaId);
      parcialesConPreguntas.add(parcialKey);
      updateLatestDate(materiaPageLastModified, materiaId, row.creado_at);
      updateLatestDate(pregunteroLastModified, materiaId, row.creado_at);
      updateLatestDate(parcialLastModified, parcialKey, row.creado_at);
    }
  }

  const materiasConResumenes = new Set<string>();
  if (isFulfilled(resumenesResult)) {
    for (const row of resumenesResult.value.data ?? []) {
      const materiaId = String(row.materia_id ?? '');
      if (!materiaId) continue;

      materiasConResumenes.add(materiaId);
      updateLatestDate(materiaPageLastModified, materiaId, row.created_at);
      updateLatestDate(pregunteroLastModified, materiaId, row.created_at);
      updateLatestDate(resumenLastModified, materiaId, row.created_at);
    }
  }

  const materiasConRecursos = new Set<string>();
  if (isFulfilled(recursosResult)) {
    for (const row of recursosResult.value.data ?? []) {
      const materiaId = String(row.materia_id ?? '');
      if (!materiaId) continue;

      materiasConRecursos.add(materiaId);
      updateLatestDate(materiaPageLastModified, materiaId, row.creado_at);
    }
  }

  if (isFulfilled(universidadesResult)) {
    for (const universidad of universidadesResult.value.data ?? []) {
      routes.push({
        url: `${baseUrl}/universidad/${universidad.id}`,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  if (isFulfilled(materiasResult)) {
    for (const materia of materiasResult.value.data ?? []) {
      const pageLastModified = materiaPageLastModified.get(materia.id);
      const questionsLastModified = pregunteroLastModified.get(materia.id);
      const summariesLastModified = resumenLastModified.get(materia.id);
      const hasQuestions = materiasConPreguntas.has(materia.id);
      const hasSummaries = materiasConResumenes.has(materia.id);
      const hasResources = materiasConRecursos.has(materia.id);
      const hasAcademicContent = hasQuestions || hasSummaries || hasResources;

      if (!hasAcademicContent) continue;

      routes.push({
        url: `${baseUrl}/explorar/materia/${materia.id}`,
        ...(pageLastModified ? { lastModified: pageLastModified } : {}),
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      const materiaSlug = buildSeoEntitySlug(materia.nombre, materia.id);
      if (hasQuestions) {
        routes.push({
          url: `${baseUrl}/pregunteros/${materiaSlug}`,
          ...(questionsLastModified ? { lastModified: questionsLastModified } : {}),
          changeFrequency: 'weekly',
          priority: 0.75,
        });

        if (parcialesConPreguntas.has(`${materia.id}:1`)) {
          const partialLastModified = parcialLastModified.get(`${materia.id}:1`);
          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/1`,
            ...(partialLastModified ? { lastModified: partialLastModified } : {}),
            changeFrequency: 'weekly',
            priority: 0.78,
          });
        }
        if (parcialesConPreguntas.has(`${materia.id}:2`)) {
          const partialLastModified = parcialLastModified.get(`${materia.id}:2`);
          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/2`,
            ...(partialLastModified ? { lastModified: partialLastModified } : {}),
            changeFrequency: 'weekly',
            priority: 0.78,
          });
        }
        if (
          parcialesConPreguntas.has(`${materia.id}:1`) &&
          parcialesConPreguntas.has(`${materia.id}:2`)
        ) {
          const partial1LastModified = parcialLastModified.get(`${materia.id}:1`);
          const partial2LastModified = parcialLastModified.get(`${materia.id}:2`);
          const integradorLastModified = [partial1LastModified, partial2LastModified]
            .filter((date): date is Date => Boolean(date))
            .sort((a, b) => b.getTime() - a.getTime())[0];

          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/integrador`,
            ...(integradorLastModified ? { lastModified: integradorLastModified } : {}),
            changeFrequency: 'weekly',
            priority: 0.76,
          });
        }
      }

      if (hasSummaries) {
        routes.push({
          url: `${baseUrl}/resumenes/${materiaSlug}`,
          ...(summariesLastModified ? { lastModified: summariesLastModified } : {}),
          changeFrequency: 'weekly',
          priority: 0.65,
        });
      }

      routes.push({
        url: `${baseUrl}/landings/estudiar/${buildSeoEntitySlug(materia.nombre, materia.id)}`,
        changeFrequency: 'monthly',
        priority: 0.65,
      });
    }
  }

  if (isFulfilled(explorarDataResult)) {
    for (const carrera of explorarDataResult.value.carreras) {
      if (!carrera.universidadId) continue;

      routes.push({
        url: `${baseUrl}/estudiar/${buildSeoEntitySlug(carrera.universidadNombre, carrera.universidadId)}/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
        changeFrequency: 'weekly',
        priority: 0.75,
      });

      routes.push({
        url: `${baseUrl}/simulador-parcial/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
        changeFrequency: 'weekly',
        priority: 0.72,
      });
    }
  }

  return routes;
}
