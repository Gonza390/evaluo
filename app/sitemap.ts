import type { MetadataRoute } from 'next';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://evaluo.com.ar';
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

  if (!isAdminClientConfigured()) {
    return routes;
  }

  try {
    const admin = createAdminClient();
    const [{ data: universidades }, { data: materias }] = await Promise.all([
      admin.from('universidades').select('id'),
      admin.from('materias').select('id'),
    ]);

    for (const universidad of universidades ?? []) {
      routes.push({
        url: `${baseUrl}/universidad/${universidad.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    for (const materia of materias ?? []) {
      routes.push({
        url: `${baseUrl}/explorar/materia/${materia.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
