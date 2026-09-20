import type { Metadata } from 'next';
import { UnlamEditorialGuide } from '@/components/marketing/unlam-editorial-guide';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/como-estudiar-ingreso-unlam';
const publishedAt = '2026-09-17';
const modifiedAt = '2026-09-18';

export const metadata: Metadata = {
  title: 'Cómo estudiar para el ingreso UNLaM 2027',
  description:
    'Guía para preparar el ingreso UNLaM 2027: cómo organizar el manual, estudiar las materias y practicar para los exámenes del Curso de Ingreso.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    title: 'Cómo estudiar para el ingreso UNLaM 2027 | Evaluo',
    description:
      'Método práctico para preparar el Curso de Ingreso UNLaM 2027: organizá el material, practicá y repasá los temas que todavía cuestan.',
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
    title: 'Cómo estudiar para el ingreso UNLaM 2027 | Evaluo',
    description:
      'Guía práctica para organizar el material del ingreso UNLaM 2027 y preparar los exámenes del Curso de Ingreso.',
    images: ['/opengraph-image.png'],
  },
};

export default function ComoEstudiarIngresoUnlamPage() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027',
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
        url: toAbsoluteUrl('/icon.png'),
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
