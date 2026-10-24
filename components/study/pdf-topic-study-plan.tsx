'use client';

import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Lightbulb,
  Play,
  Sparkles,
} from 'lucide-react';

type StudyTopic = {
  title: string;
  anchor: string;
};

type Props = {
  materialTitle: string;
  topics: StudyTopic[];
  onStart: () => void;
  onExplore: () => void;
};

/**
 * Inicio de la ruta «No estudié» de un PDF.
 * Usa los capítulos reales del resumen y propone empezar por el primero.
 * No establece bloqueos de navegación ni inventa un porcentaje de dominio.
 */
export function PdfTopicStudyPlan({ materialTitle, topics, onStart, onExplore }: Props) {
  const count = topics.length;
  const hasTopics = count > 0;

  return (
    <main
      aria-label="Plan de estudio de este PDF"
      data-first-pdf-study-plan
      data-pdf-topic-study-plan
      className="min-h-0 flex-1 overflow-y-auto bg-[#F6F8FC] overscroll-contain"
    >
      <div className="mx-auto w-full max-w-[1340px] space-y-4 px-3 py-5 pb-16 sm:px-6 lg:space-y-5 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <FileText className="size-4 shrink-0 text-[#4F5DFF]" aria-hidden="true" />
          <span className="min-w-0 max-w-[70ch] truncate">{materialTitle}</span>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#243759]">Mi plan de estudio</span>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
          <section className="relative overflow-hidden rounded-2xl border border-[#DFE6FC] bg-[linear-gradient(125deg,#EEF3FF_0%,#F8FAFF_74%,#EDF1FF_100%)] p-5 sm:p-7" aria-labelledby="study-plan-heading">
            <div className="relative z-10 max-w-[720px]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E1E9FF] px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#2753D7]">
                <ClipboardList className="size-3.5" aria-hidden="true" />
                TU PLAN DE ESTUDIO
              </span>
              <h2 id="study-plan-heading" className="mt-4 text-[clamp(1.35rem,2.3vw,2rem)] font-extrabold leading-tight tracking-[-0.035em] text-[#0F1B3D]">
                Empezá desde cero con este material
              </h2>
              <p className="mt-2 max-w-[62ch] text-[13px] leading-6 text-[#516079] sm:text-sm">
                Organizamos tu PDF por temas para que puedas aprender paso a paso. Te recomendamos empezar por el primer tema y avanzar a tu ritmo.
              </p>
              <div className="mt-6 max-w-[570px]">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#243759]">
                  <span>{hasTopics ? `Tu recorrido · ${count} ${count === 1 ? 'tema' : 'temas'}` : 'Tu recorrido'}</span>
                  <span className="text-[#5670A1]">Por comenzar</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#CBD6EB]" role="progressbar" aria-label="Progreso del plan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
                  <div className="h-full w-0 rounded-full bg-[#2563EB]" />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onStart}
                  data-study-plan-start
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#285CF6] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.17)] transition hover:bg-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <Play className="size-4 fill-white" aria-hidden="true" />
                  {hasTopics ? 'Empezar por el tema 1' : 'Abrir resumen'}
                </button>
                <button
                  type="button"
                  onClick={onExplore}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C5D0E7] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[#254077] transition hover:border-[#4F5DFF] hover:bg-white"
                >
                  <BookOpenText className="size-4" aria-hidden="true" />
                  Explorar material libremente
                </button>
              </div>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 hidden size-56 rounded-full bg-[#C9D7FF]/35 blur-2xl lg:block" />
            <FileText className="pointer-events-none absolute bottom-12 right-7 hidden size-24 -rotate-12 text-[#6A87EF]/15 lg:block" aria-hidden="true" />
          </section>

          <aside className="rounded-2xl border border-[#F0E6D8] bg-[linear-gradient(150deg,#FFFDF8_0%,#FBF7EF_100%)] p-5" aria-label="Recomendación de Evaluo">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-[#E9A009]" aria-hidden="true" />
              <h3 className="text-sm font-bold text-[#173A9D]">Recomendación de Evaluo</h3>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-[#536179]">
              Como todavía no estudiaste el material, te sugerimos comenzar por el tema 1.
            </p>
            <ol className="mt-5 space-y-5 text-xs">
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#295EF7] text-xs font-bold text-white">1</span>
                <span><strong className="block text-[13px] text-[#142A56]">Empezá por el primer tema</strong><span className="mt-1 block leading-5 text-[#617087]">Entendé los conceptos y practicá con sus ejercicios.</span></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#C8D1E0] bg-white text-xs font-bold text-[#7A88A1]">2</span>
                <span><strong className="block text-[13px] text-[#142A56]">Después, seguí con el tema 2</strong><span className="mt-1 block leading-5 text-[#617087]">Vas a poder consultar cualquier tema cuando lo necesites.</span></span>
              </li>
            </ol>
          </aside>
        </div>

        <section className="rounded-2xl border border-[#E5EAF4] bg-white p-5 sm:p-6" aria-labelledby="study-plan-method">
          <h3 id="study-plan-method" className="text-lg font-bold tracking-tight text-[#101E42]">Cómo vas a estudiar</h3>
          <p className="mt-1 text-[13px] text-[#6F7C92]">Cada tema tiene un recorrido sencillo para ayudarte a aprender y comprobar lo que sabés.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              { number: '1', label: 'Entender', description: 'Leé el resumen del tema y comprendé sus ideas principales.', Icon: BookOpenText, tone: 'text-[#285AF0] bg-[#E9EFFF]' },
              { number: '2', label: 'Recordar', description: 'Apoyate en el glosario y las flashcards para recordar conceptos.', Icon: Sparkles, tone: 'text-[#7545E7] bg-[#F0EAFF]' },
              { number: '3', label: 'Practicar', description: 'Respondé preguntas del tema para comprobar lo aprendido.', Icon: BrainCircuit, tone: 'text-[#0D966C] bg-[#E4F8EF]' },
            ].map(({ number, label, description, Icon, tone }) => (
              <div key={number} className="flex min-h-32 items-start gap-3 rounded-xl border border-[#E8ECF5] p-4">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone}`}>{number}</span>
                <div>
                  <Icon className="mb-1 size-5 text-[#4F5DFF]" aria-hidden="true" />
                  <h4 className="text-sm font-bold text-[#152249]">{label}</h4>
                  <p className="mt-1 text-xs leading-5 text-[#6E7D97]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5EAF4] bg-white p-5 sm:p-6" aria-labelledby="study-plan-topics">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 id="study-plan-topics" className="text-lg font-bold tracking-tight text-[#101E42]">Temas de este material</h3>
              <p className="mt-1 text-[13px] text-[#6F7C92]">Seguimos el orden de los capítulos de tu PDF. Podés explorar libremente cuando quieras.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667694]"><FileText className="size-4" aria-hidden="true" />{count} {count === 1 ? 'tema' : 'temas'}</span>
          </div>
          {hasTopics ? (
            <ol className="mt-5 space-y-2.5" data-study-plan-topic-list>
              {topics.map((topic, index) => (
                <li key={topic.anchor} className="flex items-center gap-3">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-[#2A61F5] text-white' : 'bg-[#EBEFF7] text-[#6F7D96]'}`}>{index + 1}</span>
                  <div className={`flex min-h-14 min-w-0 flex-1 flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${index === 0 ? 'border-[#6385FB] bg-[#F6F8FF] shadow-[0_3px_12px_rgba(37,99,235,0.07)]' : 'border-[#E8EDF5] bg-white'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-[13px] font-semibold text-[#17264C]">{topic.title}</p>
                      {index === 0 ? <span className="mt-1 inline-flex rounded-full bg-[#E0E9FF] px-2 py-0.5 text-[10px] font-bold text-[#285BF2]">Comenzá acá</span>
                        : <span className="mt-0.5 block text-[11px] text-[#8B96AB]">Tema {index + 1} · Siguiente paso recomendado</span>}
                    </div>
                    {index === 0 ? (
                      <button type="button" onClick={onStart} data-study-plan-start-first className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#285CF6] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1D4ED8]">
                        Estudiar tema 1 <ArrowRight className="size-4" aria-hidden="true" />
                      </button>
                    ) : <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#94A0B5]"><CheckCircle2 className="size-3.5" aria-hidden="true" /> Después</span>}
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="mt-4 rounded-xl bg-[#F6F8FC] p-4 text-sm text-[#64748B]">Este material todavía no tiene capítulos identificados. Podés comenzar por el resumen.</p>}
        </section>
      </div>
    </main>
  );
}
