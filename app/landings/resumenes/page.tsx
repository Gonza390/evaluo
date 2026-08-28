import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildCollectionPageJsonLd, buildFaqJsonLd } from '@/lib/seo';

const FAQ_ITEMS = [
  {
    question: '¿Qué encuentro en los resúmenes de Evaluo?',
    answer:
      'Encontrás resúmenes y materiales de estudio vinculados a materias concretas del catálogo. La disponibilidad cambia según la materia y Evaluo solo indexa páginas de resúmenes cuando existe contenido visible.',
  },
  {
    question: '¿Los resúmenes están vinculados a mi materia?',
    answer:
      'Sí. Las páginas de resúmenes se organizan por materia y conservan el contexto de carrera y universidad cuando está disponible, para que puedas seguir estudiando desde el mismo recorrido académico.',
  },
  {
    question: '¿Cómo puedo usar los resúmenes para estudiar mejor?',
    answer:
      'Usalos para ordenar el repaso y ubicar los temas principales. Después combiná el material con pregunteros, ejercicios o simuladores para comprobar qué entendiste y qué necesitás reforzar.',
  },
  {
    question: '¿Cuánto cuesta explorar los resúmenes?',
    answer:
      'Podés explorar el catálogo y las páginas públicas disponibles sin pagar. Algunas herramientas avanzadas de estudio pueden requerir una cuenta o un plan Premium.',
  },
  {
    question: '¿Quién crea los materiales disponibles?',
    answer:
      'El catálogo puede incluir recursos de estudio y materiales compartidos por estudiantes. Evaluo los organiza por materia y muestra su contexto disponible; no los presenta como material oficial ni como contenido revisado por la universidad.',
  },
];

export const metadata: Metadata = {
  title: 'Resúmenes y materiales de Universidad Siglo 21',
  description:
    'Encontrá resúmenes y materiales disponibles por materia de Universidad Siglo 21. Estudiá el contenido y conectalo con pregunteros y simuladores en Evaluo.',
  keywords: [
    'resúmenes Siglo 21',
    'resumen Universidad Siglo 21',
    'apuntes Siglo 21',
    'material de estudio Siglo 21',
    'resúmenes por materia Siglo 21',
  ],
  alternates: {
    canonical: '/landings/resumenes',
  },
  openGraph: {
    title: 'Resúmenes y materiales de Universidad Siglo 21 | Evaluo',
    description:
      'Materiales y resúmenes disponibles por materia para estudiar y continuar con práctica en Evaluo.',
    url: '/landings/resumenes',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resúmenes de Universidad Siglo 21 | Evaluo',
    description: 'Explorá materiales disponibles por materia y seguí estudiando en Evaluo.',
    images: ['/opengraph-image.png'],
  },
};

export default function ResumenesLanding() {
  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <JsonLd
        data={[
          buildCollectionPageJsonLd({
            name: 'Resúmenes y materiales de Universidad Siglo 21',
            description:
              'Colección de páginas y materiales de estudio disponibles por materia en Evaluo.',
            url: '/landings/resumenes',
          }),
          buildFaqJsonLd(FAQ_ITEMS),
        ]}
      />

      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-10 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-3 py-1.5 text-[12px] font-bold text-indigo-700 ring-1 ring-indigo-200/50">
              <FileText className="h-4 w-4 text-indigo-600" />
              Materiales por materia
            </span>

            <h1 className="text-foreground mt-4 text-[2rem] leading-[1.04] font-bold tracking-[-0.05em] sm:text-5xl lg:text-[56px]">
              Resúmenes y materiales de Universidad Siglo 21
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
              Entrá por tu materia, revisá el material disponible y continuá el estudio con pregunteros
              y simuladores desde el mismo recorrido en Evaluo.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/explorar"
                className="from-brand to-brand-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_32px_rgba(37,99,235,0.26)] sm:h-13 sm:px-8"
              >
                <PlayCircle className="h-5 w-5" />
                Explorar materias
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
              Estudio conectado
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Usá el material como punto de partida
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              El objetivo no es acumular archivos: es poder pasar del contenido a la práctica sin perder el contexto de la materia.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: 'Contenido por materia',
                description:
                  'Cada recurso se muestra dentro de una materia concreta para que sepas a qué recorrido académico pertenece.',
              },
              {
                icon: CheckCircle2,
                title: 'Disponibilidad real',
                description:
                  'Las páginas programáticas de resúmenes se indexan cuando existe contenido visible para esa materia.',
              },
              {
                icon: Sparkles,
                title: 'Del repaso a la práctica',
                description:
                  'Desde la misma materia podés continuar con preguntas, ejercicios o simuladores cuando estén disponibles.',
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
              Combiná lectura y práctica
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Usá el material para repasar y después comprobá cuánto entendiste.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: 'Leé el material',
                description:
                  'Ubicá los temas principales y organizá lo que necesitás repasar antes del parcial.',
              },
              {
                title: 'Practicá preguntas',
                description:
                  'Entrá al preguntero de la materia cuando haya preguntas disponibles para esa instancia.',
              },
              {
                title: 'Revisá tus errores',
                description:
                  'Usá los resultados del simulador para decidir qué concepto volver a estudiar.',
              },
            ].map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-[13px] font-bold text-indigo-600">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-[15px] font-bold tracking-tight text-slate-800">
                  {item.title}
                </h3>
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
              Encontrá tu materia y empezá a estudiar
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
              Explorá el catálogo actual de Universidad Siglo 21 y entrá a las materias que ya tienen contenido disponible.
            </p>
            <div className="mt-8">
              <Link
                href="/explorar"
                className="from-brand to-brand-2 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-8 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:translate-y-[-1px] hover:shadow-indigo-950/60"
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
