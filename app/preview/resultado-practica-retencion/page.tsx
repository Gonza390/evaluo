import { ArrowRight, RotateCcw } from 'lucide-react';

export const metadata = {
  title: 'Vista previa del resultado general | Evaluo',
  robots: { index: false, follow: false },
};

const topics = [
  { title: 'Metodología, Contrastación e Hipótesis', correct: 0, total: 2, available: 8 },
  { title: 'Epistemología, Ciencia y Demarcación', correct: 0, total: 1, available: 7 },
  { title: 'Estructura Conceptual y Teorías Científicas', correct: 0, total: 1, available: 6 },
  { title: 'Ciencia y sociedad', correct: 1, total: 1, available: 5 },
];

const mistakes = [
  {
    title: '¿Qué es la contrastación de una hipótesis?',
    chosen: 'Una explicación que no se puede revisar',
    expected: 'La evaluación de consecuencias contrastables de una hipótesis frente a la evidencia',
    explanation: 'Se examina si las predicciones derivadas de la hipótesis son compatibles con la evidencia disponible.',
    source: 'Tema: Metodología · Ejemplo ilustrativo',
  },
  {
    title: '¿Para qué se formula una hipótesis?',
    chosen: 'Para establecer una verdad definitiva',
    expected: 'Para proponer una explicación que pueda ponerse a prueba',
    explanation: 'La hipótesis plantea una propuesta que admite evaluación mediante evidencia.',
    source: 'Tema: Metodología · Ejemplo ilustrativo',
  },
  {
    title: '¿Qué estudia la epistemología?',
    chosen: 'Únicamente las tecnologías actuales',
    expected: 'Los fundamentos, métodos y alcances del conocimiento',
    explanation: 'La epistemología examina cómo se produce y justifica el conocimiento.',
    source: 'Tema: Epistemología · Ejemplo ilustrativo',
  },
  {
    title: '¿Qué caracteriza a una teoría científica?',
    chosen: 'Ser una opinión sin relación con evidencia',
    expected: 'Un conjunto articulado de conceptos e hipótesis que permite explicar fenómenos',
    explanation: 'Las teorías científicas organizan proposiciones y evidencias para explicar fenómenos.',
    source: 'Tema: Teorías científicas · Ejemplo ilustrativo',
  },
];

export default function PreviewPracticeResult() {
  return (
    <main className="min-h-screen bg-[#F5F7FB] px-2 py-3 sm:px-4 sm:py-5">
      <div className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-2xl border border-[#E7EBF4] bg-white shadow-[0_12px_35px_rgba(15,27,61,0.06)]">
        <header className="border-b border-[#E7EBF4] px-4 py-3 sm:px-6">
          <p className="text-xs font-medium text-[#64748B]">Volver a Mi espacio</p>
          <h1 className="mt-1 text-base font-bold text-[#0F1B3D]">Mi material de estudio · Resultado de práctica</h1>
        </header>
        <nav aria-label="Herramientas del material" className="flex gap-4 overflow-x-auto border-b border-[#E7EBF4] px-4 py-3 text-xs text-[#64748B] sm:px-6">
          <span>Resumen</span><span>Glosario</span><span>Flashcards</span>
          <span className="font-semibold text-[#4F5DFF]">Ejercicios</span><span>Progreso</span>
        </nav>
        <section aria-label="Contenido de estudio" className="@container/practice-result max-h-[calc(100dvh-145px)] overflow-y-auto px-3 py-3 sm:px-5">
        <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid min-w-0 grid-cols-1 gap-3 @min-[660px]/practice-result:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] @min-[1040px]/practice-result:grid-cols-[minmax(165px,0.7fr)_minmax(0,1.2fr)_minmax(290px,1fr)] @min-[1040px]/practice-result:gap-4">
        <header className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-[#E7EBF4] bg-white px-4 py-5 text-center @min-[660px]/practice-result:col-start-1 @min-[1040px]/practice-result:col-auto @min-[1040px]/practice-result:min-h-[260px]">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#4F5DFF] uppercase">
            Práctica terminada
          </p>
          <h1 className="mt-4 text-6xl font-bold tracking-[-0.07em] text-[#0F1B3D]">
            1 <span className="text-[#CBD5E1]">/ 5</span>
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">respuestas correctas</p>
        </header>

        <section className="min-w-0 rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5 @min-[660px]/practice-result:col-start-1 @min-[1040px]/practice-result:col-auto">
          <div className="mb-5 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#0F1B3D]">Así te fue por tema</h2>
            <span className="text-xs text-[#64748B]">4 temas evaluados</span>
          </div>
          <div className="space-y-3.5">
            {topics.map((topic) => {
              const percentage = Math.round(topic.correct / topic.total * 100);
              const allCorrect = topic.correct === topic.total;
              const needsReinforcement = topic.correct === 0;
              const barColor = allCorrect ? 'bg-emerald-500' : needsReinforcement ? 'bg-amber-500' : 'bg-[#4F5DFF]';
              const trackColor = needsReinforcement ? 'bg-amber-100' : allCorrect ? 'bg-emerald-100' : 'bg-indigo-100';
              const badgeColor = needsReinforcement
                ? 'bg-amber-50 text-amber-700'
                : allCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700';
              return (
                <div key={topic.title} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 flex-1 text-sm font-medium text-[#0F1B3D]">{topic.title}</span>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${badgeColor}`}>
                      {topic.correct}/{topic.total} · {needsReinforcement ? 'Reforzar' : allCorrect ? 'Todo correcto' : 'En progreso'}
                    </span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${trackColor}`}>
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

        <div className="flex min-w-0 flex-col rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5 @min-[660px]/practice-result:col-start-2 @min-[660px]/practice-result:row-span-2 @min-[660px]/practice-result:row-start-1 @min-[1040px]/practice-result:col-start-3 @min-[1040px]/practice-result:row-span-1">
        <section>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#4F5DFF] uppercase">
            Tu próxima acción
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0F1B3D]">
            Reforzá Metodología, Contrastación e Hipótesis
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Revisá lo que te costó y comprobá nuevamente lo aprendido.
          </p>
        </section>

        <div className="mt-auto space-y-3 pt-6">
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

        </div>
        </div>
        <details className="group mt-3 rounded-2xl border border-[#E7EBF4] bg-white px-4 py-1 sm:px-5">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[#64748B]">
            Ver todos los detalles
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="grid gap-6 border-t py-4 @min-[800px]/practice-result:grid-cols-2 @min-[800px]/practice-result:gap-7">
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
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#0F1B3D]">Preguntas para revisar · 4</h3>
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
            <details className="border-t border-[#E7EBF4] pt-4 @min-[800px]/practice-result:col-span-2">
              <summary className="cursor-pointer text-sm font-semibold text-[#0F1B3D]">
                Todas mis respuestas · 5
              </summary>
              <p className="mt-3 text-sm text-[#64748B]">
                En la pantalla real, acá vas a poder revisar las cinco respuestas, incluso las correctas.
              </p>
            </details>
            <div className="flex flex-wrap gap-3 @min-[800px]/practice-result:col-span-2">
              <span className="inline-flex min-h-10 items-center rounded-lg border border-[#E7EBF4] px-4 text-sm font-semibold text-[#0F1B3D]">
                Ver mi progreso
              </span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#E7EBF4] px-4 text-sm font-semibold text-[#0F1B3D]">
                <RotateCcw className="size-4"/> Nueva práctica
              </span>
            </div>
          </div>
        </details>
        </div>
        </section>
      </div>
      <p className="mx-auto mt-4 max-w-6xl text-center text-xs text-[#94A3B8]">
        Vista previa ilustrativa del ejercicio general: las preguntas, resultados y cantidades reales varían según el PDF.
      </p>
    </main>
  );
}
