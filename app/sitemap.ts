import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase-public';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { SITE_URL } from '@/lib/site';
import { fetchExplorarCatalogData } from '@/lib/data/catalog';

function isFulfilled<T>(
  result: PromiseSettledResult<T>
): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/explorar`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/copyright`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const client = createPublicClient();
  const [universidadesResult, materiasResult, explorarDataResult] = await Promise.allSettled([
    client.from('universidades').select('id'),
    client.from('materias').select('id, nombre'),
    fetchExplorarCatalogData(client),
  ]);

  if (isFulfilled(universidadesResult)) {
    for (const universidad of universidadesResult.value.data ?? []) {
      routes.push({
        url: `${baseUrl}/universidad/${universidad.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  if (isFulfilled(materiasResult)) {
    for (const materia of materiasResult.value.data ?? []) {
      routes.push({
        url: `${baseUrl}/explorar/materia/${materia.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      routes.push({
        url: `${baseUrl}/resumenes/${buildSeoEntitySlug(materia.nombre, materia.id)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.65,
      });
    }
  }

  if (isFulfilled(explorarDataResult)) {
    for (const carrera of explorarDataResult.value.carreras) {
      if (!carrera.universidadId) continue;

      routes.push({
        url: `${baseUrl}/estudiar/${buildSeoEntitySlug(carrera.universidadNombre, carrera.universidadId)}/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.75,
      });

      routes.push({
        url: `${baseUrl}/simulador-parcial/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.72,
      });
    }
  }

  return routes;
}
