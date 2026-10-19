import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase-public';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { SITE_URL } from '@/lib/site';
import { hasSubstantialStudyLandingContent } from '@/lib/seo-content-signals';
import { fetchExplorarCatalogData } from '@/lib/data/catalog';

function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
    },
    {
      url: `${baseUrl}/explorar`,
    },
    {
      url: `${baseUrl}/pregunteros`,
    },
    {
      url: `${baseUrl}/ia-para-estudiantes`,
    },
    {
      url: `${baseUrl}/como-estudiar-ingreso-unlam`,
      lastModified: new Date('2026-09-17'),
    },
    {
      url: `${baseUrl}/blog/tecnicas-de-estudio-efectivas`,
      lastModified: new Date('2026-09-23'),
    },
    {
      url: `${baseUrl}/estudiar-pdf-con-ia`,
    },
    {
      url: `${baseUrl}/funciones/resumir-pdf-con-ia`,
    },
    {
      url: `${baseUrl}/funciones/crear-flashcards-desde-pdf`,
    },
    {
      url: `${baseUrl}/funciones/crear-mapa-mental-desde-pdf`,
    },
    {
      url: `${baseUrl}/pricing`,
    },
    {
      url: `${baseUrl}/landings/parciales`,
    },
    {
      url: `${baseUrl}/landings/resumenes`,
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
    client.from('resumenes').select('materia_id').limit(10000),
    client.from('recursos').select('materia_id').limit(10000),
  ]);

  const materiaLastModified = new Map<string, Date>();
  const materiaQuestionCount = new Map<string, number>();
  const materiaSummaryCount = new Map<string, number>();
  const materiaResourceCount = new Map<string, number>();
  const materiasConPreguntas = new Set<string>();
  const parcialesConPreguntas = new Set<string>();
  if (isFulfilled(frescuraResult)) {
    for (const row of frescuraResult.value.data ?? []) {
      const materiaId = String(row.materia_id ?? '');
      const creadoAt = row.creado_at;
      if (!materiaId) continue;
      materiaQuestionCount.set(materiaId, (materiaQuestionCount.get(materiaId) ?? 0) + 1);
      materiasConPreguntas.add(materiaId);
      parcialesConPreguntas.add(`${materiaId}:${Number(row.parcial ?? 1)}`);
      if (!creadoAt) continue;
      const date = new Date(creadoAt);
      const current = materiaLastModified.get(materiaId);
      if (!current || date.getTime() > current.getTime()) {
        materiaLastModified.set(materiaId, date);
      }
    }
  }

  const materiasConResumenes = new Set<string>();
  if (isFulfilled(resumenesResult)) {
    for (const row of resumenesResult.value.data ?? []) {
      if (!row.materia_id) continue;
      const materiaId = String(row.materia_id);
      materiasConResumenes.add(materiaId);
      materiaSummaryCount.set(materiaId, (materiaSummaryCount.get(materiaId) ?? 0) + 1);
    }
  }

  const materiasConRecursos = new Set<string>();
  if (isFulfilled(recursosResult)) {
    for (const row of recursosResult.value.data ?? []) {
      if (!row.materia_id) continue;
      const materiaId = String(row.materia_id);
      materiasConRecursos.add(materiaId);
      materiaResourceCount.set(materiaId, (materiaResourceCount.get(materiaId) ?? 0) + 1);
    }
  }

  if (isFulfilled(universidadesResult)) {
    for (const universidad of universidadesResult.value.data ?? []) {
      routes.push({
        url: `${baseUrl}/universidad/${universidad.id}`,
      });
    }
  }

  if (isFulfilled(materiasResult)) {
    for (const materia of materiasResult.value.data ?? []) {
      const questionLastModified = materiaLastModified.get(materia.id);
      const hasQuestions = materiasConPreguntas.has(materia.id);
      const hasSummaries = materiasConResumenes.has(materia.id);
      const hasResources = materiasConRecursos.has(materia.id);
      const hasAcademicContent = hasQuestions || hasSummaries || hasResources;
      const hasIndexableStudyLandingContent = hasSubstantialStudyLandingContent({
        questionCount: materiaQuestionCount.get(materia.id) ?? 0,
        summaryCount: materiaSummaryCount.get(materia.id) ?? 0,
        resourceCount: materiaResourceCount.get(materia.id) ?? 0,
      });

      if (!hasAcademicContent) continue;

      const materiaSlug = buildSeoEntitySlug(materia.nombre, materia.id);
      routes.push({
        url: `${baseUrl}/explorar/materia/${materiaSlug}`,
        ...(questionLastModified ? { lastModified: questionLastModified } : {}),
      });

      if (hasQuestions) {
        routes.push({
          url: `${baseUrl}/pregunteros/${materiaSlug}`,
          ...(questionLastModified ? { lastModified: questionLastModified } : {}),
        });

        if (parcialesConPreguntas.has(`${materia.id}:1`)) {
          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/1`,
            ...(questionLastModified ? { lastModified: questionLastModified } : {}),
          });
        }
        if (parcialesConPreguntas.has(`${materia.id}:2`)) {
          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/2`,
            ...(questionLastModified ? { lastModified: questionLastModified } : {}),
          });
        }
        if (
          parcialesConPreguntas.has(`${materia.id}:1`) &&
          parcialesConPreguntas.has(`${materia.id}:2`)
        ) {
          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/integrador`,
            ...(questionLastModified ? { lastModified: questionLastModified } : {}),
          });
        }
      }

      if (hasSummaries) {
        routes.push({
          url: `${baseUrl}/resumenes/${materiaSlug}`,
        });
      }

      if (hasIndexableStudyLandingContent) {
        routes.push({
          url: `${baseUrl}/landings/estudiar/${materiaSlug}`,
        });
      }
    }
  }

  if (isFulfilled(explorarDataResult)) {
    for (const carrera of explorarDataResult.value.carreras) {
      if (!carrera.universidadId) continue;

      routes.push({
        url: `${baseUrl}/estudiar/${buildSeoEntitySlug(carrera.universidadNombre, carrera.universidadId)}/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
      });

      routes.push({
        url: `${baseUrl}/simulador-parcial/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
      });
    }
  }

  return routes;
}
