import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildCollectionPageJsonLd, buildFaqJsonLd } from '@/lib/seo';

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
  title: 'Pregunteros y práctica para parciales de Universidad Siglo 21',
  description:
    'Prepará tus parciales de Universidad Siglo 21 con pregunteros organizados por materia, primer parcial, segundo parcial e integrador. Solo mostramos contenido disponible en Evaluo.',
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
    title: 'Pregunteros y práctica para parciales de Universidad Siglo 21 | Evaluo',
    description:
      'Encontrá pregunteros por materia y parcial y practicá con el contenido disponible en Evaluo.',
    url: '/landings/parciales',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pregunteros para parciales de Universidad Siglo 21 | Evaluo',
    description: 'Practicá por materia y parcial con los pregunteros disponibles en Evaluo.',
    images: ['/opengraph-image.png'],
  },
};

export default function ParcialesLanding() {
  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
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
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-3 py-1.5 text-[12px] font-bold text-indigo-700 ring-1 ring-indigo-200/50">
              <FileText className="h-4 w-4 text-indigo-600" />
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

      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
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
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                className="from-brand to-brand-2 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-8 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:translate-y-[-1px] hover:shadow-indigo-950/60"
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
