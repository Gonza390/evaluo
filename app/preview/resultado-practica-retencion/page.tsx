import { ArrowRight, RotateCcw } from 'lucide-react';

export const metadata = {
  title: 'Vista previa del resultado general | Evaluo',
  robots: { index: false, follow: false },
};

const topics = [
  { title: 'Segmentación', correct: 3, total: 3, available: 12 },
  { title: 'Posicionamiento', correct: 3, total: 4, available: 8 },
  { title: 'Mercado meta', correct: 1, total: 3, available: 9 },
];

const mistakes = [
  {
    title: '¿Qué caracteriza al mercado meta?',
    chosen: 'Todos los consumidores del mercado',
    expected: 'El segmento específico al que se dirige la oferta',
    explanation: 'La empresa selecciona uno o más segmentos; no necesariamente se dirige a todo el mercado.',
    source: 'Tema: Mercado meta · Página 8',
  },
  {
    title: '¿En qué se diferencia un segmento de un mercado meta?',
    chosen: 'Son exactamente lo mismo',
    expected: 'Un segmento es un grupo identificado; se convierte en meta cuando la organización decide atenderlo',
    explanation: 'Segmentar permite identificar grupos; elegir un mercado meta es una decisión posterior.',
    source: 'Tema: Mercado meta · Página 9',
  },
  {
    title: '¿Qué busca el posicionamiento?',
    chosen: 'Aumentar la cantidad de segmentos existentes',
    expected: 'Construir una percepción diferenciada en la mente del público objetivo',
    explanation: 'El posicionamiento se relaciona con la percepción de una propuesta respecto a sus alternativas.',
    source: 'Tema: Posicionamiento · Página 6',
  },
];

export default function PreviewPracticeResult() {
  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-10 sm:py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-[#E7EBF4] bg-white px-5 py-8 shadow-[0_18px_48px_rgba(15,27,61,0.04)] sm:px-9 sm:py-10">
        <header className="text-center">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#4F5DFF] uppercase">
            Práctica terminada
          </p>
          <h1 className="mt-4 text-6xl font-bold tracking-[-0.07em] text-[#0F1B3D]">
            7 <span className="text-[#CBD5E1]">/ 10</span>
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">respuestas correctas</p>
        </header>

        <section className="mt-8 border-t border-[#E7EBF4] pt-6">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#0F1B3D]">Así te fue por tema</h2>
            <span className="text-xs text-[#64748B]">3 temas evaluados</span>
          </div>
          <div className="space-y-4">
            {topics.map((topic) => {
              const percentage = Math.round(topic.correct / topic.total * 100);
              const barColor = percentage === 100
                ? 'bg-emerald-500'
                : percentage >= 70 ? 'bg-[#4F5DFF]' : 'bg-amber-500';
              return (
                <div key={topic.title} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#0F1B3D]">{topic.title}</span>
                    <span className="shrink-0 text-sm text-[#64748B]">{topic.correct}/{topic.total}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#EAEFF5]">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-[#64748B]">
            Aciertos en esta tanda, no dominio definitivo de los temas.
          </p>
        </section>

        <section className="mt-6 border-t border-[#E7EBF4] pt-6">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#4F5DFF] uppercase">
            Tu próxima acción
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0F1B3D]">
            Reforzá Mercado meta
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Revisá lo que te costó y comprobá nuevamente lo aprendido.
          </p>
        </section>

        <div className="mt-7 space-y-3">
          <div className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F5DFF] px-5 text-sm font-semibold text-white">
            Continuar ahora <ArrowRight className="size-4" aria-hidden="true" />
          </div>
          <div className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#D5DCEB] bg-white px-5 text-sm font-semibold text-[#0F1B3D]">
            Continuar mañana
          </div>
          <p className="text-center text-xs text-[#64748B]">
            Si elegís mañana, el repaso queda guardado en Mi espacio.
          </p>
        </div>

        <details className="group mt-5 border-t border-[#E7EBF4] pt-4">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 text-sm font-medium text-[#64748B]">
            Ver todos los detalles
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="space-y-6 pt-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#0F1B3D]">Resultados de todos los temas</h3>
              {topics.map((topic) => (
                <div key={topic.title}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[#0F1B3D]">{topic.title}</span>
                    <span className="text-[#64748B]">{topic.correct}/{topic.total}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#64748B]">
                    En esta tanda aparecieron {topic.total} de {topic.available} preguntas válidas disponibles del tema.
                    {topic.correct === topic.total && topic.total < topic.available
                      ? ' Aún hay otras preguntas por comprobar.' : ''}
                  </p>
                </div>
              ))}
              <p className="text-xs text-[#64748B]">
                Esta cobertura describe solamente la tanda, no todo el historial.
              </p>
            </div>
            <div className="space-y-3 border-t border-[#E7EBF4] pt-5">
              <h3 className="text-sm font-semibold text-[#0F1B3D]">Preguntas para revisar · 3</h3>
              {mistakes.map((item) => (
                <details key={item.title} className="rounded-xl border border-[#E7EBF4] px-3 py-3">
                  <summary className="cursor-pointer text-sm font-medium leading-6 text-[#0F1B3D]">
                    {item.title}
                  </summary>
                  <div className="space-y-3 pt-3 text-sm leading-6 text-[#475569]">
                    <p><strong className="text-[#0F1B3D]">Tu respuesta: </strong>{item.chosen}</p>
                    <p><strong className="text-[#0F1B3D]">Respuesta correcta: </strong>{item.expected}</p>
                    <p><strong className="text-[#0F1B3D]">¿Por qué? </strong>{item.explanation}</p>
                    <p className="text-xs text-[#64748B]">{item.source}</p>
                  </div>
                </details>
              ))}
            </div>
            <details className="border-t border-[#E7EBF4] pt-5">
              <summary className="cursor-pointer text-sm font-semibold text-[#0F1B3D]">
                Todas mis respuestas · 10
              </summary>
              <p className="mt-3 text-sm text-[#64748B]">
                En la pantalla real, acá vas a poder revisar las diez respuestas, incluso las correctas.
              </p>
            </details>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex min-h-10 items-center rounded-lg border border-[#E7EBF4] px-4 text-sm font-semibold text-[#0F1B3D]">
                Ver mi progreso
              </span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#E7EBF4] px-4 text-sm font-semibold text-[#0F1B3D]">
                <RotateCcw className="size-4"/> Nueva práctica
              </span>
            </div>
          </div>
        </details>
      </section>
      <p className="mx-auto mt-4 max-w-xl text-center text-xs text-[#94A3B8]">
        Vista previa ilustrativa del ejercicio general: las preguntas, resultados y cantidades reales varían según el PDF.
      </p>
    </main>
  );
}
