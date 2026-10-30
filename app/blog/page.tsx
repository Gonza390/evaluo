import type { Metadata } from 'next';
import { StudyBlogHub } from '@/components/marketing/study-blog-view';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/blog';
export const metadata: Metadata = {
  title: 'Blog de estudio: técnicas, exámenes y métodos por materia',
  description: 'Guías gratuitas sobre técnicas de estudio, contabilidad, exámenes orales, finales y cómo estudiar apuntes PDF largos con ejemplos.',
  alternates: { canonical: toAbsoluteUrl(path), languages: { es: toAbsoluteUrl(path), en: toAbsoluteUrl('/en/blog'), 'x-default': toAbsoluteUrl(path) } },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', title: 'Blog de estudio | Evaluo', description: 'Métodos de estudio con ejemplos y ejercicios útiles, sin necesidad de registrarte.', url: toAbsoluteUrl(path), locale: 'es_AR' },
};
export default function BlogPage() { return <StudyBlogHub locale="es" />; }
