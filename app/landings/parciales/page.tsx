import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle2, PlayCircle, Sparkles, ArrowRight } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildCollectionPageJsonLd, buildFaqJsonLd } from '@/lib/seo';
import { loadPregunteroHubData } from '@/app/pregunteros/data';
import { isSiglo21University } from '@/lib/seo-search-copy';
import { buildSeoEntitySlug } from '@/lib/seo-intents';

export const revalidate = 3600;

const FAQ_ITEMS = [
  {
    question: '¿Qué encuentro en la sección de parciales de Evaluo?',
    answer:
      'Encontrás pregunteros y bancos de preguntas organizados por materia y por instancia de parcial. Evaluo muestra estas páginas cuando existe contenido disponible para practicar.',
  },
  {
    question: '¿Cómo puedo usar los pregunteros para estudiar?',
    answer:
      'Intentá responder las preguntas sin mirar apuntes, revisá tus errores al terminar y volvé sobre los temas que todavía no dominás. También podés usar el simulador para practicar con tiempo.',
  },
  {
    question: '¿Hay pregunteros de Universidad Siglo 21?',
    answer:
      'Sí. El catálogo público actual de pregunteros está concentrado en Universidad Siglo 21 y se organiza por carrera, materia, primer parcial, segundo parcial e integrador cuando existe contenido para cada instancia.',
  },
  {
    question: '¿Son exámenes oficiales o parciales resueltos de la universidad?',
    answer:
      'No. Evaluo es una plataforma independiente y no presenta sus bancos como exámenes oficiales de ninguna universidad. Son preguntas y materiales de práctica organizados para ayudarte a preparar cada materia.',
  },
  {
    question: '¿Necesito pagar para explorar los pregunteros?',
    answer:
      'Podés explorar las materias y pregunteros públicos sin pagar. Algunas funciones avanzadas de práctica o estudio pueden requerir una cuenta o un plan Premium.',
  },
];

export const metadata: Metadata = {
  title: 'Parciales Siglo 21: práctica y simuladores por carrera',
  description:
    'Prepará parciales de Universidad Siglo 21: encontrá pregunteros por materia y simuladores disponibles por carrera. Practicá primer parcial, segundo parcial e integrador.',
  keywords: [
    'parciales Siglo 21',
    'pregunteros Siglo 21',
    'primer parcial Siglo 21',
    'segundo parcial Siglo 21',
    'preguntas parcial Universidad Siglo 21',
  ],
  alternates: {
    canonical: '/landings/parciales',
  },
  openGraph: {
    title: 'Parciales Siglo 21: práctica y simuladores por carrera | Evaluo',
    description:
      'Encontrá pregunteros por materia y parcial y practicá con el contenido disponible en Evaluo.',
    url: '/landings/parciales',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parciales Siglo 21: pregunteros y simuladores | Evaluo',
    description: 'Practicá por materia y parcial con los pregunteros disponibles en Evaluo.',
    images: ['/opengraph-image.png'],
  },
};

export default async function ParcialesLanding() {
  // Only include publicly published careers with questions, never speculative links.
  // The page keeps its useful static content if the catalog is briefly unavailable.
  const activeCareers = await loadPregunteroHubData().catch(() => []);
  const siglo21Simulators = activeCareers
    .filter((career) => isSiglo21University(career.universidadNombre) && career.materias.length > 0)
    .sort((a, b) => b.materias.length - a.materias.length || a.carreraNombre.localeCompare(b.carreraNombre, 'es'))
    .slice(0, 6);
  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <JsonLd
        data={[
          buildCollectionPageJsonLd({
            name: 'Pregunteros y práctica para parciales de Universidad Siglo 21',
            description:
              'Colección de pregunteros y páginas de práctica por materia y parcial disponibles en Evaluo.',
            url: '/landings/parciales',
          }),
          buildFaqJsonLd(FAQ_ITEMS),
        ]}
      />

      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-10 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50/80 px-3 py-1.5 text-[12px] font-bold text-blue-700 ring-1 ring-blue-200/50">
              <FileText className="h-4 w-4 text-blue-600" />
              Pregunteros por materia
            </span>

            <h1 className="text-foreground mt-4 text-[2rem] leading-[1.04] font-bold tracking-[-0.05em] sm:text-5xl lg:text-[56px]">
              Prepará tus parciales de Universidad Siglo 21
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
              Encontrá materias con preguntas disponibles y practicá primer parcial, segundo parcial
              o integrador desde el preguntero de Evaluo.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/pregunteros"
                className="from-brand to-brand-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_32px_rgba(37,99,235,0.26)] sm:h-13 sm:px-8"
              >
                <PlayCircle className="h-5 w-5" />
                Ver pregunteros disponibles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {siglo21Simulators.length > 0 ? (
        <section aria-labelledby="simuladores-carrera-siglo21" className="border-b border-slate-100 bg-slate-50/60 py-12 sm:py-16">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Práctica disponible por carrera</p>
            <h2 id="simuladores-carrera-siglo21" className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Simuladores de parciales Siglo 21 por carrera
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Si buscás un simulador de parcial de Universidad Siglo 21, elegí una carrera con materias y preguntas públicas disponibles.
              Los ejercicios son de práctica de Evaluo, no exámenes oficiales de la universidad.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siglo21Simulators.map((career) => (
                <Link
                  key={career.carreraId}
                  href={`/simulador-parcial/${buildSeoEntitySlug(career.carreraNombre, career.carreraId)}`}
                  className="group flex min-h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
                >
                  <strong className="text-sm leading-6 text-slate-950 group-hover:text-blue-700">{career.carreraNombre}</strong>
                  <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
                    Ver simulador y materias disponibles <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-600">
              ¿No encontrás tu carrera? Consultá el{' '}
              <Link href="/pregunteros" className="font-semibold text-blue-700 underline underline-offset-2">
                catálogo completo de pregunteros por materia
              </Link>.
            </p>
          </div>
        </section>
      ) : null}

      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              ¿Por qué practicar preguntas?
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Convertí el repaso en práctica activa
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Resolver preguntas te ayuda a comprobar qué entendiste y dónde todavía necesitás otra vuelta.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: 'Entrá por tu materia',
                description:
                  'El catálogo organiza los pregunteros por carrera y materia para que llegues directo a la práctica que necesitás.',
              },
              {
                icon: CheckCircle2,
                title: 'Elegí el parcial',
                description:
                  'Cuando hay contenido, podés practicar primer parcial, segundo parcial o integrador desde una URL específica.',
              },
              {
                icon: Sparkles,
                title: 'Revisá tus errores',
                description:
                  'Usá el simulador para responder, corregir y detectar qué temas conviene reforzar antes de volver a intentar.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-[15px] font-bold tracking-tight text-slate-800">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-xs leading-5 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Cómo aprovechar mejor cada práctica
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: 'Practicá sin mirar los apuntes',
                description:
                  'Respondé primero con lo que recordás. Así la práctica mide recuperación real y no solo reconocimiento.',
              },
              {
                title: 'Revisá cada error',
                description:
                  'No alcanza con conocer la opción correcta. Entendé qué concepto te faltó para evitar repetir el error.',
              },
              {
                title: 'Volvé a la materia',
                description:
                  'Combiná el preguntero con los resúmenes y materiales disponibles de la misma materia.',
              },
              {
                title: 'Repetí antes del parcial',
                description:
                  'Hacé otra práctica después de repasar los temas débiles y compará cómo cambia tu rendimiento.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[15px] font-bold tracking-tight text-slate-800">{item.title}</h3>
                <p className="mt-3 text-xs leading-5 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Preguntas frecuentes sobre parciales
            </h2>
          </div>

          <div className="mx-auto max-w-2xl space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none text-[15px] font-bold text-slate-800">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(99,102,241,0.03)_0%,rgba(37,99,235,0.03)_100%)] p-8 text-center shadow-xl md:p-14">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Buscá tu materia y empezá a practicar
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
              Entrá al catálogo de pregunteros de Universidad Siglo 21 y elegí la instancia que estás preparando.
            </p>
            <div className="mt-8">
              <Link
                href="/pregunteros"
                className="from-brand to-brand-2 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-8 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:translate-y-[-1px] hover:shadow-blue-950/60"
              >
                <PlayCircle className="h-4.5 w-4.5" />
                Ver pregunteros
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
