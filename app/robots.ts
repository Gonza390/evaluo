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

// Variantes que no aportan al índice (la página canónica es la URL sin
// parámetros) y que cuestan una función por pedido: los buscadores las recorrían
// por miles. El simulador ya es noindex; la ruta materia-cache es interna.
const crawlWasteRoutes = [
  '/*?*carreraId=',
  '/*?*tab=',
  '/*?*creador=',
  '/*?*modulo=',
  '/explorar/materia-cache/',
  '/simulador/',
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
      { userAgent: '*', allow: '/', disallow: [...privateRoutes, ...crawlWasteRoutes] },
      ...publicCrawlers.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: [...privateRoutes, ...crawlWasteRoutes],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
