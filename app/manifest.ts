import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Evaluo | Estudiá tu PDF con IA',
    short_name: 'Evaluo',
    description:
      'Subí tus apuntes en PDF y estudiá con resúmenes, mapas mentales, flashcards y práctica sobre el mismo material.',
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
        name: 'Estudiar un PDF',
        short_name: 'Subir PDF',
        description: 'Subí tus apuntes y empezá a estudiar con Evaluo.',
        url: '/dashboard/materiales?openUpload=1',
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
