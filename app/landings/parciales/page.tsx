import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildCourseJsonLd, buildFaqJsonLd } from '@/lib/seo';

const FAQ_ITEMS = [
  {
    question: '¿Qué son los parciales resueltos?',
    answer:
      'Son exámenes parciales de universidades argentinas que ya fueron rendidos, con sus preguntas y respuestas resueltas. Sirven para que puedas practicar con material real y te familiarices con el formato y el nivel de exigencia de cada materia.',
  },
  {
    question: '¿Cómo puedo usar los parciales resueltos para estudiar?',
    answer:
      'Te recomendamos intentar resolver las preguntas por tu cuenta antes de ver las respuestas. Después, compará tus respuestas con las soluciones y explicaciones. Esto te permite identificar tus puntos débiles y reforzarlos antes del examen.',
  },
  {
    question: '¿Los parciales resueltos son de mi universidad?',
    answer:
      'Evaluo cuenta con parciales y pregunteros adaptados a las principales universidades argentinas: UBA, UTN, UNC, UNLP, UADE, UCA, UdeSA, UTDT y muchas más. Encontrá el contenido específico de tu materia y tu cátedra.',
  },
  {
    question: '¿Qué diferencia hay entre un parcial resuelto y un simulador?',
    answer:
      'Un parcial resuelto es material estático que podés revisar a tu ritmo. Un simulador de examen es una experiencia interactiva con cronómetro, ponderación y formato similar al de un examen real, que te ayuda a medir tu confianza y velocidad.',
  },
  {
    question: '¿Necesito pagar para acceder a los parciales?',
    answer:
      'En Evaluo podés explorar el catálogo de materias y acceder a material de ejemplo gratis. Para contenido completo y simuladores, creá una cuenta gratuita y desbloqueá todo lo que necesitás para preparar tus parciales.',
  },
];

export const metadata: Metadata = {
  title: 'Parciales resueltos de universidades argentinas',
  description:
    'Encontrá parciales resueltos de las principales universidades argentinas. Practicá con preguntas reales de UBA, UTN, UNC, UNLP y más para preparar tus exámenes.',
  alternates: {
    canonical: '/landings/parciales',
  },
  openGraph: {
    title: 'Parciales resueltos de universidades argentinas | Evaluo',
    description:
      'Parciales resueltos de UBA, UTN, UNC, UNLP y más. Practicá con material real para aprobar tus parciales.',
    url: '/landings/parciales',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function ParcialesLanding() {
  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <JsonLd
        data={[
          buildCourseJsonLd({
            name: 'Parciales resueltos de universidades argentinas',
            description:
              'Accedé a parciales resueltos y pregunteros de las principales universidades argentinas para preparar tus exámenes con Evaluo.',
            url: '/landings/parciales',
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
              Material de estudio real
            </span>

            <h1 className="mt-4 text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-[56px]">
              Parciales resueltos de universidades argentinas
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
              Practicá con preguntas reales de exámenes pasados. Encontrá parciales resueltos de
              UBA, UTN, UNC, UNLP y otras universidades para estudiar con confianza.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/explorar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_32px_rgba(37,99,235,0.26)] sm:h-13 sm:px-8"
              >
                <PlayCircle className="h-5 w-5" />
                Buscar mi universidad
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              ¿Por qué practicar con parciales?
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Cómo usar los parciales resueltos
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Practicar con material de exámenes reales es una de las mejores formas de prepararte.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: 'Conocé el formato',
                description:
                  'Cada universidad y cada profesor tiene un estilo diferente. Conocer el formato del parcial te permite llegar más tranquilo al examen.',
              },
              {
                icon: CheckCircle2,
                title: 'Identificá temas recurrentes',
                description:
                  'Al practicar con varios parciales, detectás qué temas se repiten y cuáles tenés que reforzar.',
              },
              {
                icon: Sparkles,
                title: 'Medí tu nivel real',
                description:
                  'Intentá resolver el parcial solo y cronometrado. Después revisá las respuestas para saber exactamente dónde estás parado.',
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

      {/* TIPS DE ESTUDIO */}
      <section className="bg-white border-y border-slate-100 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Tips para aprovechar al máximo los parciales
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: 'Simulá la presión del examen',
                description:
                  'Ponete un cronómetro y intentá resolver las preguntas sin usar apuntes. Esto te prepara para la presión del día del examen.',
              },
              {
                title: 'Revisá cada error',
                description:
                  'No alcanza con ver la respuesta correcta. Entendé por qué te equivocaste en cada pregunta para no repetir el error.',
              },
              {
                title: 'Combiná con pregunteros',
                description:
                  'Los parciales te dan contexto, pero los pregunteros te permiten practicar temas específicos con más profundidad.',
              },
              {
                title: 'Empezá con materias que ya cursaste',
                description:
                  'Practicá primero con materias que ya cursaste para afianzar conocimientos y ganar confianza antes de abordar temas nuevos.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
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
              Empezá a practicar hoy
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-sm leading-6 text-slate-600">
              Encontrá tu universidad, elegí tu materia y accedé a parciales resueltos,
              pregunteros y simuladores. Todo en un solo lugar.
            </p>
            <div className="mt-8">
              <Link
                href="/explorar"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-8 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:translate-y-[-1px] hover:shadow-indigo-950/60"
              >
                <PlayCircle className="h-4.5 w-4.5" />
                Buscar mi universidad
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
