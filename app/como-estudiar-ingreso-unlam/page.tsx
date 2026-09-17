import type { Metadata } from 'next';
import { UnlamEditorialGuide } from '@/components/marketing/unlam-editorial-guide';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/como-estudiar-ingreso-unlam';
const reviewedAt = '2026-09-17';

export const metadata: Metadata = {
  title: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027',
  description:
    'Guía para preparar el Curso de Ingreso UNLaM 2027: cómo organizar el manual, estudiar las materias, practicar para los exámenes y repasar mejor.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    title: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027 | Evaluo',
    description:
      'Método práctico para estudiar el material del ingreso UNLaM 2027, organizar temas, repasar y llegar mejor preparado a las evaluaciones.',
    url: toAbsoluteUrl(path),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027 | Evaluo',
    description:
      'Guía práctica para organizar el material del ingreso UNLaM, estudiar las materias y preparar las evaluaciones.',
  },
};

export default function ComoEstudiarIngresoUnlamPage() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027',
    description:
      'Guía práctica para preparar el Curso de Ingreso de la Universidad Nacional de La Matanza usando el material oficial como fuente de estudio.',
    datePublished: reviewedAt,
    dateModified: reviewedAt,
    inLanguage: 'es-AR',
    author: { '@type': 'Organization', name: 'Evaluo' },
    publisher: { '@type': 'Organization', name: 'Evaluo', url: toAbsoluteUrl('/') },
    mainEntityOfPage: toAbsoluteUrl(path),
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
