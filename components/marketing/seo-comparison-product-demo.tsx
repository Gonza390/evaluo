import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, FileText } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import demoArtifacts from '@/public/material-general-prueba.study.json';

type DemoSection = { title: string; body: string };
type DemoGlossaryItem = { term: string; definition: string };

const demoSections = demoArtifacts.summary.sections as DemoSection[];
const demoGlossary = demoArtifacts.glossary as DemoGlossaryItem[];
const sampleSection = demoSections[0];
const sampleConcept = demoGlossary.find((item) => item.term === 'Aprendizaje automático') ?? demoGlossary[0];

function DemoLink({
  href,
  label,
  comparison,
  ctaName,
  primary = false,
}: {
  href: string;
  label: string;
  comparison: string;
  ctaName: string;
  primary?: boolean;
}) {
  return (
    <TrackedLink
      href={href}
      eventName="cta_click"
      payload={{ location: 'seo_comparison_' + comparison + '_real_demo', cta_name: ctaName, destination: '/demo/material-estudio' }}
      className={
        primary
          ? 'from-brand to-brand-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-5 py-3 text-sm font-bold text-white shadow-[0_10px_26px_rgba(37,99,235,0.18)] transition hover:-translate-y-0.5'
          : 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:border-blue-300'
      }
    >
      {label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
    </TrackedLink>
  );
}

/**
 * Uses the exact curated PDF, summary and glossary powering the public product demo.
 * The questions, corrections and progress remain interactive inside DemoFourStepStudy.
 * No private student material or fabricated product performance is displayed.
 */
export function SeoComparisonProductDemo({ comparison }: { comparison: 'notebooklm' | 'chatgpt' | 'quizlet' }) {
  const source = 'seo-comparison-' + comparison;
  const summaryHref = '/demo/material-estudio?tour=0&source=' + source;
  const practiceHref = '/demo/material-estudio?tour=0&start=ejercicios&source=' + source;

  return (
    <section className="border-b border-slate-100 bg-white py-16 sm:py-20" aria-labelledby="seo-comparison-real-demo">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">04 / Producto comprobable</p>
        <h2 id="seo-comparison-real-demo" className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Probá cómo se estudia con Evaluo, desde un PDF de muestra
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Esta demostración pública utiliza el material «IA y nuevas tecnologías» que ya está cargado
          en Evaluo. Podés navegar el resumen, abrir los conceptos, responder ejercicios, comprobar
          la corrección y ver cómo se refleja la práctica en el progreso. Usamos las mismas pantallas
          de estudio de la plataforma; no mostramos capturas inventadas ni resultados de alumnos.
        </p>

        <div className="mt-8 overflow-hidden rounded-[24px] border border-blue-100 bg-slate-50/60 shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-950">IA y nuevas tecnologías</p>
                <p className="text-xs text-slate-500">PDF de muestra de Evaluo · {demoArtifacts.pageCount} páginas</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Material navegable
            </span>
          </div>
          <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-blue-700"><BookOpen className="h-4 w-4" aria-hidden="true" /> Resumen de la muestra</span>
              <h3 className="mt-3 text-lg font-bold text-slate-950">{sampleSection.title}</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{sampleSection.body}</p>
            </article>
            <div className="grid gap-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Concepto del glosario</p>
                <h3 className="mt-3 text-base font-bold text-slate-950">{sampleConcept.term}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{sampleConcept.definition}</p>
              </article>
              <article className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-blue-700"><ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Ejercicios interactivos</span>
                <h3 className="mt-3 text-base font-bold text-slate-950">Respondé y revisá tu progreso</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  Las preguntas, la explicación y el progreso se generan y muestran en la demo real
                  del producto. Tus respuestas de prueba no modifican tu historial académico.
                </p>
              </article>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white p-5 sm:p-7">
            <DemoLink href={practiceHref} label="Probar los ejercicios reales de la demo" comparison={comparison} ctaName="demo_ejercicios" primary />
            <DemoLink href={summaryHref} label="Explorar el resumen y las tarjetas" comparison={comparison} ctaName="demo_resumen" />
          </div>
        </div>
        <p className="mt-4 text-xs leading-6 text-slate-500">
          Fuente de esta vista: el mismo material público de la demostración de Evaluo
          (material-general-prueba.study.json). Es un PDF de muestra preparado para enseñar el
          funcionamiento, no un testimonio ni una sesión de un estudiante real.
        </p>
      </div>
    </section>
  );
}
