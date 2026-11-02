import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Keep private/authenticated routes outside every crawler's allowed scope.
// A separate explicit policy for AI search should never override these exclusions.
const privateRoutes = [
  '/admin',
  '/administrador',
  '/auth/callback',
  '/calendario',
  '/completar-perfil',
  '/configuracion',
  '/dashboard',
  '/login',
];

const publicCrawlers = [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: privateRoutes },
      ...publicCrawlers.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: privateRoutes,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
