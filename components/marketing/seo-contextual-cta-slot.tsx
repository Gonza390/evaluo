'use client';

import { ArrowRight, FileText, Sparkles, UploadCloud } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { TrackedLink } from '@/components/marketing/tracked-link';

const uploadHref = '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1';

type ContextualCtaConfig = {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  trackingPrefix: string;
  ctaName: string;
};

const CTA_BY_PATH: Record<string, ContextualCtaConfig> = {
  '/ia-para-estudiantes': {
    eyebrow: 'Probalo con tu material',
    title: 'Elegí qué necesitás hacer y empezá desde tus propios apuntes.',
    description:
      'Subí un PDF una sola vez y usalo como fuente para entender, organizar, repasar o practicar según el momento de estudio.',
    buttonLabel: 'Subir mis apuntes',
    trackingPrefix: 'seo_ia_estudiantes',
    ctaName: 'contextual_subir_material',
  },
  '/estudiar-pdf-con-ia': {
    eyebrow: 'Tu PDF, listo para estudiar',
    title: 'Convertí el documento que ya tenés en una sesión de estudio.',
    description:
      'Empezá con tu PDF y mantené el mismo material como contexto para resumen, glosario, mapa mental, flashcards y ejercicios.',
    buttonLabel: 'Subir mi PDF y empezar',
    trackingPrefix: 'seo_estudiar_pdf_ia',
    ctaName: 'contextual_estudiar_pdf',
  },
  '/funciones/resumir-pdf-con-ia': {
    eyebrow: 'Llevá tu PDF a Evaluo',
    title: '¿Tenés el documento que querés resumir?',
    description:
      'Subilo para ordenar las ideas principales y seguir trabajando el mismo material después del resumen.',
    buttonLabel: 'Crear mi resumen',
    trackingPrefix: 'seo_resumir_pdf_ia',
    ctaName: 'contextual_crear_resumen',
  },
  '/funciones/crear-flashcards-desde-pdf': {
    eyebrow: 'Repasá tu propio contenido',
    title: 'Convertí los conceptos de tu PDF en tarjetas para estudiar.',
    description:
      'Usá tu material como fuente y creá flashcards conectadas con el tema que realmente estás preparando.',
    buttonLabel: 'Crear mis flashcards',
    trackingPrefix: 'seo_flashcards_pdf',
    ctaName: 'contextual_crear_flashcards',
  },
  '/funciones/crear-mapa-mental-desde-pdf': {
    eyebrow: 'Visualizá tu propio material',
    title: 'Pasá tu PDF de una lectura lineal a un mapa de conceptos.',
    description:
      'Subí el documento que estás estudiando y organizá visualmente sus temas, subtemas y relaciones.',
    buttonLabel: 'Crear mi mapa mental',
    trackingPrefix: 'seo_mapa_mental_pdf',
    ctaName: 'contextual_crear_mapa_mental',
  },
};

export function SeoContextualCtaSlot() {
  const pathname = usePathname();
  const config = CTA_BY_PATH[pathname];

  if (!config) return null;

  return (
    <section
      aria-label="Siguiente paso"
      className="border-t border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-14 sm:px-8 sm:py-18"
    >
      <div className="mx-auto max-w-[1040px] overflow-hidden rounded-[30px] border border-indigo-100 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-11">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {config.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
              {config.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{config.description}</p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
                Tu material como fuente
              </span>
              <span>Sin cambiar de documento entre herramientas</span>
            </div>
          </div>

          <TrackedLink
            href={uploadHref}
            eventName="cta_click"
            payload={{
              location: `${config.trackingPrefix}_contextual`,
              cta_name: config.ctaName,
              destination: uploadHref,
              experiment: 'seo_contextual_cta_v1',
              landing: pathname,
            }}
            className="from-brand to-brand-2 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 lg:w-auto"
          >
            <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
            {config.buttonLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
