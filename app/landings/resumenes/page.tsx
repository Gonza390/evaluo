import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildCourseJsonLd, buildFaqJsonLd } from '@/lib/seo';

const FAQ_ITEMS = [
  {
    question: '¿Qué son los resúmenes de estudio?',
    answer:
      'Son documentos estructurados que sintetizan los temas más importantes de cada materia universitaria. Están elaborados por estudiantes destacados y revisados académicamente para que estudies de forma más eficiente.',
  },
  {
    question: '¿Los resúmenes están adaptados a mi universidad?',
    answer:
      'Sí. En Evaluo cada resumen está vinculado a una materia específica de una universidad y carrera concretas. Así aseguramos que el contenido sea relevante para tu plan de estudio y tu cátedra.',
  },
  {
    question: '¿Cómo puedo usar los resúmenes para estudiar mejor?',
    answer:
      'Te recomendamos leer el resumen antes de ir a clase para tener una base, y repasarlo después para afianzar lo aprendido. Combiná los resúmenes con pregunteros y simuladores para un estudio completo.',
  },
  {
    question: '¿Cuánto cuesta acceder a los resúmenes?',
    answer:
      'Podés explorar el catálogo y acceder a material de ejemplo gratis. Para acceder al contenido completo de todas las materias, creá una cuenta gratuita en Evaluo.',
  },
  {
    question: '¿Quiénes elaboran los resúmenes?',
    answer:
      'Los resúmenes son elaborados por estudiantes de las propias universidades que tienen buen rendimiento académico, y son revisados para garantizar precisión y claridad.',
  },
];

export const metadata: Metadata = {
  title: 'Resúmenes de estudio universitario',
  description:
    'Encontrá resúmenes de estudio de las principales universidades argentinas. Material ordenado por materia, carrera y universidad para estudiar más eficiente.',
  alternates: {
    canonical: '/landings/resumenes',
  },
  openGraph: {
    title: 'Resúmenes de estudio universitario | Evaluo',
    description:
      'Resúmenes de estudio de UBA, UTN, UNC, UNLP y más. Material ordenado para estudiar mejor.',
    url: '/landings/resumenes',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function ResumenesLanding() {
  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <JsonLd
        data={[
          buildCourseJsonLd({
            name: 'Resúmenes de estudio universitario',
            description:
              'Accedé a resúmenes de estudio de las principales universidades argentinas, ordenados por materia y carrera en Evaluo.',
            url: '/landings/resumenes',
          }),
          buildFaqJsonLd(FAQ_ITEMS),
        ]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-3 py-1.5 text-[12px] font-bold text-indigo-700 ring-1 ring-indigo-200/50">
              <FileText className="h-4 w-4 text-indigo-600" />
              Material de estudio
            </span>

            <h1 className="mt-4 text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-[56px]">
              Resúmenes de estudio universitario
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
              Encontrá resúmenes claros y ordenados de las principales universidades argentinas.
              Material relevante para tu materia, tu carrera y tu plan de estudio.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/explorar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_32px_rgba(37,99,235,0.26)] sm:h-13 sm:px-8"
              >
                <PlayCircle className="h-5 w-5" />
                Explorar materias
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUÉ USAR RESÚMENES */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Estudiá de forma más inteligente
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              ¿Por qué usar resúmenes de estudio?
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Un buen resumen te permite cubrir más temas en menos tiempo y retener mejor la
              información clave.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: 'Contenido ordenado',
                description:
                  'Los resúmenes están estructurados por temas y unidades, para que puedas seguir un orden lógico de estudio sin perderte.',
              },
              {
                icon: CheckCircle2,
                title: 'Revisados académicamente',
                description:
                  'No son apuntes sueltos de internet. Cada resumen es revisado para asegurar que la información sea precisa y relevante.',
              },
              {
                icon: Sparkles,
                title: 'Adaptados a tu plan',
                description:
                  'Cada resumen está vinculado a una materia específica de tu universidad, así que sabés que es lo que realmente necesitás estudiar.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-[15px] font-bold text-slate-800 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CÓMO COMBINAR */}
      <section className="bg-slate-50 border-y border-slate-100 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Combiná resúmenes con otras herramientas
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Los resúmenes son el punto de partida. Complementalos con pregunteros y simuladores
              para un estudio completo.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: 'Leé el resumen',
                description:
                  'Empezá por leer el resumen de la materia para tener una base sólida de los temas principales.',
              },
              {
                title: 'Practicá con pregunteros',
                description:
                  'Respondé preguntas específicas de la materia para verificar cuánto retuviste y qué temas necesitás reforzar.',
              },
              {
                title: 'Rendí un simulacro',
                description:
                  'Simulá un examen real con cronómetro y preguntas de distinto nivel para medir tu preparación.',
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-[13px] font-bold text-indigo-600">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-slate-800 tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 border-t border-slate-100">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Preguntas frecuentes
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
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(99,102,241,0.03)_0%,rgba(37,99,235,0.03)_100%)] p-8 text-center shadow-xl md:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Encontrá tu materia y empezá a estudiar
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-sm leading-6 text-slate-600">
              Explorá el catálogo de universidades y carreras. Accedé a resúmenes, pregunteros y
              simuladores adaptados a tu plan de estudio.
            </p>
            <div className="mt-8">
              <Link
                href="/explorar"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-8 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:translate-y-[-1px] hover:shadow-indigo-950/60"
              >
                <PlayCircle className="h-4.5 w-4.5" />
                Explorar materias
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
