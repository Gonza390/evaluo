import { ArrowRight, BookOpen, CheckCircle2, FileText, Layers3 } from 'lucide-react';

/** Illustrative English sample, never presented as extracted user document data. */
const examples = [
  {
    label: '01 / ORGANIZE',
    heading: 'Find the main topics',
    description: 'Evaluo identifies concepts and sections so you can study one topic at a time.',
    cue: 'Topics detected',
    entries: ['Supply and demand', 'Price elasticity', 'Market equilibrium'],
  },
  {
    label: '02 / UNDERSTAND',
    heading: 'Read a focused summary',
    description: 'We prepare explanations and keep your original document available for checking.',
    cue: 'Key concepts',
    entries: ['Elasticity measures responsiveness to price changes.', 'Demand usually falls as price rises.', 'Compare explanations with the original source.'],
  },
  {
    label: '03 / REMEMBER',
    heading: 'Review with flashcards',
    description: 'Key terms become active-recall prompts rather than just more text to reread.',
    cue: 'Sample flashcard',
    entries: ['Question: What is price elasticity of demand?', 'Answer: How strongly quantity demanded responds to price changes.'],
  },
  {
    label: '04 / PRACTICE',
    heading: 'Check what you know',
    description: 'Practice questions and explanations help you identify what needs more work.',
    cue: 'Sample practice',
    entries: ['Question: If a product is elastic and its price rises, what usually happens?', 'Answer: Quantity demanded falls more than proportionally.', 'Feedback: Review the relationship between price and demand.'],
  },
];

export function EnglishProcessingScene({ scene, fileName }: { scene: number; fileName: string }) {
  const example = examples[Math.max(0, Math.min(examples.length - 1, scene))]!;
  return (
    <div data-processing-layout="english" data-pdf-processing-scene-content className="mx-auto grid w-full max-w-[800px] gap-4 lg:grid-cols-[1.15fr_1fr]">
      <section className="min-w-0 rounded-[20px] border border-[#dbe6f8] bg-[#f8faff] p-4 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#3c6cba]">{example.label}</p>
        <h2 className="mt-3 text-[20px] font-bold tracking-tight text-[#0f1623]">{example.heading}</h2>
        <p className="mt-3 text-[13px] leading-6 text-[#42506A]">{example.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#3c6cba]">
          {scene === 0 ? <Layers3 className="size-4"/> : scene === 1 ? <BookOpen className="size-4"/> : <CheckCircle2 className="size-4"/>}
          {example.cue} <ArrowRight className="size-3.5"/>
        </div>
        <div className="mt-3 space-y-2">
          {example.entries.map((entry, index) => (
            <div key={entry} className="flex items-start gap-2 rounded-xl border border-[#e3eaf5] bg-white px-3 py-2.5 text-[12px] leading-5 text-[#344054]">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[10px] font-bold text-[#3c6cba]">{index + 1}</span>
              <span>{entry}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="flex min-w-0 flex-col rounded-[20px] border border-[#e3eaf5] bg-white p-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-5 shrink-0 text-[#3c6cba]" />
          <span className="truncate text-[12px] font-semibold text-[#344054]" title={fileName}>{fileName}</span>
        </div>
        <div className="mt-5 flex min-h-[130px] flex-1 flex-col justify-center gap-3 rounded-xl bg-[#f8faff] p-5" aria-hidden="true">
          {[95, 74, 87, 62, 91, 71].map((width, i) => (
            <span key={i} className={i === 2 ? 'h-2 rounded-full bg-[#bbd1fb]' : 'h-2 rounded-full bg-[#e1e8f4]'} style={{width:width+'%'}} />
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#667085]">Illustrative example · Your study content comes from your uploaded document.</p>
      </section>
    </div>
  );
}
