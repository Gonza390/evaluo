import type { MetadataRoute } from 'next';
import { buildSeoEntitySlug, getSiglo21PregunteroHub } from '@/lib/seo-siglo21';

export const revalidate = 3600;

const SITE_URL = 'https://evaluo.com.ar';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/explorar`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/pregunteros`, changeFrequency: 'daily', priority: 0.95 },
    { url: `${SITE_URL}/pricing`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/copyright`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  try {
    const hub = await getSiglo21PregunteroHub();

    for (const item of hub?.items ?? []) {
      const slug = buildSeoEntitySlug(item.materiaNombre, item.materiaId);

      routes.push({
        url: `${SITE_URL}/pregunteros/${slug}`,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
      routes.push({
        url: `${SITE_URL}/explorar/materia/${item.materiaId}`,
        changeFrequency: 'weekly',
        priority: 0.75,
      });

      if (item.preguntasParcial1 > 0) {
        routes.push({
          url: `${SITE_URL}/pregunteros/${slug}/parcial/1`,
          changeFrequency: 'weekly',
          priority: 0.88,
        });
      }

      if (item.preguntasParcial2 > 0) {
        routes.push({
          url: `${SITE_URL}/pregunteros/${slug}/parcial/2`,
          changeFrequency: 'weekly',
          priority: 0.88,
        });
      }

      if (item.preguntasParcial1 > 0 && item.preguntasParcial2 > 0) {
        routes.push({
          url: `${SITE_URL}/pregunteros/${slug}/parcial/integrador`,
          changeFrequency: 'weekly',
          priority: 0.82,
        });
      }
    }
  } catch (error) {
    console.error('Could not build Siglo 21 sitemap entries:', error);
  }

  return routes;
}
