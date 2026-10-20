import type { Metadata } from 'next';
import { UnlamEditorialGuide } from '@/components/marketing/unlam-editorial-guide';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/como-estudiar-ingreso-unlam';
const publishedAt = '2026-09-17';
const modifiedAt = '2026-10-20';

export const metadata: Metadata = {
  title: 'Curso de Ingreso UNLaM 2027: materias y cómo estudiar',
  description:
    'Curso de Ingreso UNLaM 2027: modelos de examen anteriores, materias por carrera, ejercicios de práctica y cómo estudiar el manual con Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    title: 'Curso de Ingreso UNLaM 2027: materias y cómo estudiar | Evaluo',
    description:
      'Modelos de examen de ingreso UNLaM de años anteriores, materias según la carrera y ejercicios originales para practicar con tus apuntes PDF.',
    url: toAbsoluteUrl(path),
    images: [
      {
        url: toAbsoluteUrl('/opengraph-image.png'),
        width: 1200,
        height: 630,
        alt: 'Cómo estudiar para el ingreso UNLaM 2027 | Evaluo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Curso de Ingreso UNLaM 2027: materias y cómo estudiar | Evaluo',
    description:
      'Materias, fechas y estrategias para preparar el manual de ingreso UNLaM 2027. Probá ejercicios gratis antes de estudiar tu PDF.',
    images: ['/opengraph-image.png'],
  },
};

export default function ComoEstudiarIngresoUnlamPage() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Curso de Ingreso UNLaM 2027: materias, fechas y cómo estudiar',
    description:
      'Guía práctica para preparar el Curso de Ingreso de la Universidad Nacional de La Matanza usando el material oficial como fuente de estudio.',
    datePublished: publishedAt,
    dateModified: modifiedAt,
    inLanguage: 'es-AR',
    isAccessibleForFree: true,
    image: [toAbsoluteUrl('/opengraph-image.png')],
    author: {
      '@type': 'Organization',
      '@id': toAbsoluteUrl('/#organization'),
      name: 'Evaluo',
      url: toAbsoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      '@id': toAbsoluteUrl('/#organization'),
      name: 'Evaluo',
      url: toAbsoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl('/evaluo-logo-icono.svg'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': toAbsoluteUrl(path),
    },
  };

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Evaluo', path: '/' },
            { name: 'Guía de ingreso UNLaM 2027', path },
          ]),
          articleJsonLd,
        ]}
      />
      <UnlamEditorialGuide />
    </>
  );
}
