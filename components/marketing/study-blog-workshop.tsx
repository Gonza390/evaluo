import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import type { StudyBlogWorkshop, StudyBlogWorkshopTable } from '@/lib/study-blog-workshop-types';
import type { StudyBlogLocale } from '@/lib/study-blog-articles';

const copy = {
  es: {
    source: 'Referencias específicas de esta guía',
    sourceNote: 'Las situaciones, cifras, tablas y ejercicios son ejemplos originales de aprendizaje, no evaluaciones oficiales. Verificá las definiciones y los procedimientos con la bibliografía de tu materia.',
    teaching: 'Desarrollo paso a paso',
    reveal: 'Ver respuesta razonada',
    practice: 'Practicá antes de mirar la solución',
    related: 'Profundizá estos temas',
    method: 'Cómo se elaboró esta guía',
    methodText: 'Contenido educativo de Evaluo, asistido por herramientas digitales y organizado con ejemplos originales, referencias académicas y un criterio de autocorrección. No sustituye a docentes, programas ni materiales oficiales. No se atribuye revisión profesional externa.',
  },
  en: {
    source: 'Topic-specific reference material',
    sourceNote: 'The scenarios, numbers, tables and activities are original educational examples, not official assessments. Check definitions and procedures against your course requirements.',
    teaching: 'Worked explanation',
    reveal: 'Show the reasoned answer',
    practice: 'Try this before seeing the answer',
    related: 'Explore related methods',
    method: 'How this guide was prepared',
    methodText: 'Educational content from Evaluo, prepared with digital assistance, original worked examples, academic references and a self-check approach. It does not replace official course guidance or claim independent professional review.',
  },
} as const;

function ResourceTable({ data }: { data: StudyBlogWorkshopTable }) {
  return (
    <figure className="mt-7">
      <figcaption className="mb-3 text-base font-bold leading-6 text-[#0F1B3D]">{data.title}</figcaption>
      <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[530px] border-collapse text-left text-[13px] leading-6 sm:text-sm">
          <thead className="bg-slate-100">
            <tr>
              {data.columns.map(column => (
                <th key={column} scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-900 sm:px-4">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((cells, index) => (
              <tr key={index} className={index % 2 ? 'bg-slate-50/70' : 'bg-white'}>
                {cells.map((cell, cellIndex) => (
                  cellIndex === 0
                    ? <th key={cellIndex} scope="row" className="px-3 py-3 align-top font-semibold text-slate-800 sm:px-4">{cell}</th>
                    : <td key={cellIndex} className="px-3 py-3 align-top text-slate-700 sm:px-4">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-600">{data.caption}</p>
    </figure>
  );
}

export function StudyBlogWorkshopView({
  locale,
  workshop,
}: {
  locale: StudyBlogLocale;
  workshop: StudyBlogWorkshop;
}) {
  const t = copy[locale];
  const base = locale === 'es' ? '/blog/' : '/en/blog/';
  return (
    <section id="guia-practica" aria-labelledby="workshop-title" className="mt-12 scroll-mt-24 border-t border-slate-200 pt-10">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{workshop.eyebrow}</p>
      <h2 id="workshop-title" className="mt-3 text-2xl font-bold leading-[1.25] tracking-[-0.025em] sm:text-[1.9rem]">{workshop.title}</h2>
      <p className="mt-5 text-[15px] leading-[1.85] text-slate-700 sm:text-base">{workshop.intro}</p>
      <ResourceTable data={workshop.table} />

      <section id="caso-resuelto" aria-labelledby="case-title" className="mt-11 scroll-mt-24">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">{t.teaching}</p>
        <h3 id="case-title" className="mt-2 text-xl font-bold tracking-[-0.02em] text-[#0F1B3D]">{workshop.walkthrough.title}</h3>
        <p className="mt-4 text-[15px] leading-8 text-slate-700">{workshop.walkthrough.intro}</p>
        <ol className="mt-6 space-y-5">
          {workshop.walkthrough.steps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
              <p className="pt-0.5 text-[15px] leading-[1.85] text-slate-700">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-7 border-l-[3px] border-[#4F5DFF] bg-[#F8FAFF] px-4 py-4 text-[15px] font-medium leading-8 text-slate-800">{workshop.walkthrough.outcome}</p>
        <ResourceTable data={workshop.secondTable} />
      </section>

      <section id="autoevaluacion" aria-labelledby="practice-title" className="mt-12 scroll-mt-24 border-t border-slate-200 pt-9">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">{t.practice}</p>
        <h3 id="practice-title" className="mt-2 text-xl font-bold tracking-tight">{workshop.practice.title}</h3>
        <p className="mt-4 text-[15px] leading-8 text-slate-700">{workshop.practice.instructions}</p>
        <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {workshop.practice.items.map((item, index) => (
            <div className="px-4 py-5 sm:px-5" key={index}>
              <p className="text-sm font-bold leading-7 text-slate-900">{index + 1}. {item.question}</p>
              <details className="group mt-3 rounded-lg bg-slate-50 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-blue-700 underline-offset-4 group-open:underline">{t.reveal}</summary>
                <p className="mt-3 border-t border-slate-200 pt-3 text-sm leading-7 text-slate-700">{item.answer}</p>
              </details>
            </div>
          ))}
        </div>
      </section>

      <section id="plantilla" aria-labelledby="action-title" className="mt-12 scroll-mt-24 rounded-2xl bg-[#F7F8FC] px-5 py-8 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">{locale === 'es' ? 'Recurso para llevarte' : 'Takeaway resource'}</p>
        <h3 id="action-title" className="mt-2 text-xl font-bold tracking-tight">{workshop.action.title}</h3>
        <p className="mt-4 text-[15px] leading-8 text-slate-700">{workshop.action.text}</p>
        <ol className="mt-5 space-y-3">
          {workshop.action.steps.map((step, index) => (
            <li className="flex gap-3 text-sm leading-7 text-slate-700" key={index}>
              <span className="font-bold tabular-nums text-blue-700">{String(index + 1).padStart(2, '0')}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="referencias-especificas" aria-labelledby="reference-title" className="mt-12 scroll-mt-24 border-t border-slate-200 pt-8">
        <h3 id="reference-title" className="text-xl font-bold tracking-tight">{t.source}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{t.sourceNote}</p>
        <ul className="mt-4 space-y-3">
          {workshop.sources.map(s => (
            <li key={s.url}>
              <a href={s.url} rel="noopener noreferrer" target="_blank" className="inline-flex items-start gap-1.5 text-sm font-semibold leading-7 text-blue-700 underline underline-offset-4">
                <span>{s.title}</span><ExternalLink aria-hidden="true" className="mt-1.5 h-3.5 w-3.5 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
        <h4 className="mt-8 text-sm font-bold">{t.method}</h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">{t.methodText}</p>
      </section>

      <nav aria-label={t.related} className="mt-8 rounded-xl border border-slate-200 px-5 py-5">
        <p className="text-sm font-bold">{t.related}</p>
        <div className="mt-3 flex flex-col gap-3">
          {workshop.related.map(link => (
            <Link key={link.slug} href={base + link.slug} className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-blue-700 hover:underline">
              {link.label}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </Link>
          ))}
        </div>
      </nav>
    </section>
  );
}
