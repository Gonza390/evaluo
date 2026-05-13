import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/login', '/auth/callback'],
      },
    ],
    sitemap: 'https://evaluo.com.ar/sitemap.xml',
    host: 'https://evaluo.com.ar',
  };
}
