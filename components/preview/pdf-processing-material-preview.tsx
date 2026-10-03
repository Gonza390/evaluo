'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';

export type ProcessingMaterialEntry = 'diagnostic' | 'summary' | 'tools';
type Tool = 'summary' | 'practice' | 'glossary' | 'cards' | 'map';

const topics = [
  {
    name: 'Finalismo',
    title: 'Teoría de la acción',
    text: 'La acción humana se caracteriza por su orientación hacia un fin. La persona anticipa un objetivo y dirige su conducta para alcanzarlo.',
    takeaway: 'La finalidad forma parte de la acción.',
  },
  {
    name: 'Culpabilidad',
    title: 'La culpabilidad',
    text: 'La culpabilidad expresa un reproche personal. Se analiza si, en las circunstancias del caso, podía exigírsele a la persona actuar de otra manera.',
    takeaway: 'Se considera la exigibilidad de actuar de otra manera, no solo el resultado.',
  },
];

// Contenido preparado para probar el recorrido. No genera IA ni guarda resultados de cuenta.
const questions = [
  {
    topic: 0,
    prompt: 'Según el finalismo, ¿qué caracteriza a la acción humana?',
    options: [
      'El resultado, sin considerar el objetivo.',
      'Una conducta orientada hacia un fin.',
      'Un movimiento sin dirección.',
    ],
    correct: 1,
  },
  {
    topic: 1,
    prompt:
      'Se analiza si una persona podía actuar de otra manera. ¿Qué concepto se está evaluando?',
    options: [
      'La culpabilidad como reproche personal.',
      'Únicamente el resultado de la conducta.',
      'La finalidad como único criterio.',
    ],
    correct: 0,
  },
  {
    topic: 0,
    prompt:
      'Una persona anticipa un objetivo y elige cómo alcanzarlo. ¿Qué aspecto destaca el finalismo?',
    options: [
      'Solo el resultado obtenido.',
      'La ausencia de una intención.',
      'La dirección de la conducta hacia un fin.',
    ],
    correct: 2,
  },
  {
    topic: 1,
    prompt: '¿Por qué producir un resultado no basta para analizar la culpabilidad?',
    options: [
      'Porque el resultado nunca importa.',
      'Porque también se evalúa si era exigible actuar de otro modo.',
      'Porque toda conducta tiene el mismo reproche.',
    ],
    correct: 1,
  },
  {
    topic: 0,
    prompt:
      '¿Qué diferencia a una acción orientada a un objetivo de una descripción basada solo en el resultado?',
    options: [
      'Considerar el fin hacia el que se dirige la conducta.',
      'Ignorar lo que la persona hace.',
      'Suponer que el resultado explica todo.',
    ],
    correct: 0,
  },
  {
    topic: 1,
    prompt: 'En este material, ¿en qué se apoya el juicio de reproche personal?',
    options: [
      'Solo en que ocurrió un resultado.',
      'En la existencia de cualquier objetivo.',
      'En si podía exigirse actuar conforme a derecho en esas circunstancias.',
    ],
    correct: 2,
  },
];

const tools: { id: Tool; label: string }[] = [
  { id: 'summary', label: 'Resumen' },
  { id: 'practice', label: 'Práctica' },
  { id: 'cards', label: 'Tarjetas' },
  { id: 'glossary', label: 'Glosario' },
  { id: 'map', label: 'Mapa mental' },
];

export function PdfProcessingMaterialPreview({
  entry,
  onBack,
}: {
  entry: ProcessingMaterialEntry;
  onBack: () => void;
}) {
  const [tool, setTool] = useState<Tool>(entry === 'diagnostic' ? 'practice' : 'summary');
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewTopic, setReviewTopic] = useState<number | null>(null);
  const contentHeading = useRef<HTMLHeadingElement>(null);
  const radioName = useId();
  const finished = answers.length === questions.length;
  const question = questions[answers.length];
  const wrongTopics = [
    ...new Set(
      answers.flatMap((answer, index) =>
        answer === questions[index].correct ? [] : [questions[index].topic]
      )
    ),
  ];

  useEffect(() => {
    contentHeading.current?.focus({ preventScroll: true });
  }, [finished, answers.length]);

  function advance() {
    if (selected === null || finished) return;
    setAnswers((current) => [...current, selected]);
    setSelected(null);
  }

  function openSummary() {
    setReviewTopic(wrongTopics[0] ?? null);
    setTool('summary');
  }

  function onToolKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tools.length
        : event.key === 'ArrowLeft'
          ? (index + tools.length - 1) % tools.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tools.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setTool(tools[next].id);
    document.getElementById(`${radioName}-tab-${tools[next].id}`)?.focus();
  }

  return (
    <section className="journey-material" aria-label="Material procesado">
      <button className="journey-material-back" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Volver a tu PDF listo
      </button>
      <header className="journey-material-header">
        <span className="journey-eyebrow">Material de estudio</span>
        <h1>Derecho penal · Unidad 2</h1>
        <p>
          <FileText size={16} aria-hidden="true" /> Derecho penal · Unidad 2.pdf
        </p>
      </header>
      <div className="journey-material-tabs" role="tablist" aria-label="Herramientas de tu PDF">
        {tools.map((item, index) => (
          <button
            key={item.id}
            id={`${radioName}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tool === item.id}
            aria-controls={`${radioName}-panel`}
            tabIndex={tool === item.id ? 0 : -1}
            onClick={() => setTool(item.id)}
            onKeyDown={(event) => onToolKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="journey-material-panel"
        id={`${radioName}-panel`}
        role="tabpanel"
        aria-labelledby={`${radioName}-tab-${tool}`}
      >
        {tool === 'summary' && (
          <>
            <h2 ref={contentHeading} tabIndex={-1}>
              Resumen de tu PDF
            </h2>
            {reviewTopic !== null && (
              <div className="journey-material-recommendation">
                <strong>Según tus respuestas, empezá por {topics[reviewTopic].name}.</strong>
                <p>Repasá este concepto y después volvé a comprobarlo.</p>
              </div>
            )}
            {[...topics]
              .sort(
                (a, b) =>
                  Number(b === topics[reviewTopic ?? -1]) - Number(a === topics[reviewTopic ?? -1])
              )
              .map((topic) => (
                <article key={topic.name}>
                  <h3>{topic.title}</h3>
                  <p>{topic.text}</p>
                  <p className="journey-material-takeaway">{topic.takeaway}</p>
                </article>
              ))}
            <button
              className="journey-start-button"
              type="button"
              onClick={() => setTool('practice')}
            >
              Ver qué tanto sé <ArrowRight size={16} />
            </button>
          </>
        )}
        {tool === 'practice' &&
          (finished ? (
            <>
              <h2 ref={contentHeading} tabIndex={-1}>
                Ya sabés por dónde empezar
              </h2>
              <p>
                {answers.filter((answer, index) => answer === questions[index].correct).length} de{' '}
                {questions.length} respuestas correctas.
              </p>
              {wrongTopics.length ? (
                <div className="journey-material-recommendation">
                  <strong>
                    Te conviene repasar {wrongTopics.map((index) => topics[index].name).join(' y ')}
                    .
                  </strong>
                  <p>Estas respuestas orientan tu próximo repaso de este PDF.</p>
                </div>
              ) : (
                <p>
                  En estas preguntas no detectamos conceptos para reforzar. Podés seguir estudiando
                  tu material.
                </p>
              )}
              <button className="journey-start-button" type="button" onClick={openSummary}>
                {wrongTopics.length ? 'Repasar estos temas' : 'Ir al resumen'}{' '}
                <ArrowRight size={16} />
              </button>
              <button
                className="journey-tools-button"
                type="button"
                onClick={() => {
                  setAnswers([]);
                  setSelected(null);
                }}
              >
                Volver a comprobar
              </button>
            </>
          ) : (
            <>
              <span className="journey-eyebrow" aria-live="polite">
                Pregunta {answers.length + 1} de {questions.length}
              </span>
              <h2 ref={contentHeading} tabIndex={-1}>
                Ver qué tanto sé
              </h2>
              <p>No es una nota. Tus respuestas ayudan a elegir qué repasar.</p>
              <fieldset className="journey-material-answers">
                <legend>{question.prompt}</legend>
                {question.options.map((option, index) => (
                  <label key={option} data-selected={selected === index}>
                    <input
                      type="radio"
                      name={radioName}
                      value={index}
                      checked={selected === index}
                      onChange={() => setSelected(index)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>
              <button
                className="journey-start-button"
                type="button"
                disabled={selected === null}
                onClick={advance}
              >
                {answers.length === questions.length - 1
                  ? 'Ver qué repasar'
                  : 'Confirmar y continuar'}{' '}
                <ArrowRight size={16} />
              </button>
            </>
          ))}
        {tool === 'glossary' && (
          <>
            <h2 ref={contentHeading} tabIndex={-1}>
              Glosario
            </h2>
            <p>Los conceptos principales de este material.</p>
            <dl>
              {topics.map((topic) => (
                <div key={topic.name}>
                  <dt>{topic.name}</dt>
                  <dd>{topic.text}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
        {tool === 'cards' && (
          <>
            <h2 ref={contentHeading} tabIndex={-1}>
              Tarjetas de repaso
            </h2>
            <p>Intentá recordar antes de ver la respuesta.</p>
            <div className="journey-material-card">
              <h3>¿Qué caracteriza a la acción en el finalismo?</h3>
              {flipped && <p>{topics[0].text}</p>}
              <button
                className="journey-summary-button"
                type="button"
                onClick={() => setFlipped(!flipped)}
                aria-expanded={flipped}
              >
                {flipped ? 'Ocultar respuesta' : 'Ver respuesta'}
              </button>
            </div>
          </>
        )}
        {tool === 'map' && (
          <>
            <h2 ref={contentHeading} tabIndex={-1}>
              Mapa mental
            </h2>
            <p>Cómo se conectan los conceptos de este PDF.</p>
            <ul className="journey-material-map">
              {topics.map((topic) => (
                <li key={topic.name}>
                  <Check size={18} aria-hidden="true" />
                  <div>
                    <strong>{topic.name}</strong>
                    <p>{topic.takeaway}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
