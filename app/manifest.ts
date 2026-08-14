import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Evaluo | Simulador de exámenes universitarios',
    short_name: 'Evaluo',
    description:
      'Estudia y practica parciales universitarios argentinos con simuladores, resúmenes y pregunteros en un solo lugar.',
    id: '/',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#050B2C',
    theme_color: '#2563EB',
    lang: 'es-AR',
    dir: 'ltr',
    categories: ['education', 'productivity', 'study'],
    icons: [
      {
        src: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-dark-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Explorar universidades',
        short_name: 'Explorar',
        description: 'Abre el catálogo de universidades, carreras y materias.',
        url: '/explorar',
      },
      {
        name: 'Mi dashboard',
        short_name: 'Dashboard',
        description: 'Abre tu panel de estudio con progreso y materias activas.',
        url: '/dashboard',
      },
      {
        name: 'Calendario académico',
        short_name: 'Calendario',
        description: 'Ve tus parciales y fechas clave del cuatrimestre.',
        url: '/calendario',
      },
    ],
  };
}
