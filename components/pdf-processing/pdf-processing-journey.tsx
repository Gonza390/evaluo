import {
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  FileText,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import './pdf-processing.css';

export const processingScenes = [
  {
    label: 'Entender',
    title: 'Encontrá por dónde empezar.',
    description: 'Tu PDF se transforma en un resumen por temas para saber qué estudiar.',
  },
  {
    label: 'Practicar',
    title: 'Comprobá qué entendiste.',
    description: 'Después, practicá con preguntas de este mismo PDF para descubrir qué entendiste.',
  },
  {
    label: 'Reforzar',
    title: 'Evaluo recuerda lo que te cuesta',
    description:
      'Tus errores quedan guardados para que puedas entenderlos con tu PDF y volver a comprobarlos.',
  },
] as const;

function SceneExample({ scene, sample }: { scene: number; sample: boolean }) {
  if (scene === 0)
    return (
      <div className="journey-example">
        <div className="journey-example-label">
          <BookOpen size={16} /> Temas principales
        </div>
        <ol className="journey-topics">
          {(sample
            ? ['La conducta y su finalidad', 'La culpabilidad']
            : ['Tema principal de tu PDF', 'Otro concepto clave']
          ).map((topic, index) => (
            <li key={topic}>
              <span>0{index + 1}</span>
              {topic}
            </li>
          ))}
        </ol>
      </div>
    );
  if (scene === 1)
    return (
      <div className="journey-example">
        <div className="journey-example-label">
          <BookOpen size={16} /> Práctica con tu PDF
        </div>
        <p className="journey-question">
          {sample
            ? 'Según el finalismo, ¿qué caracteriza a la acción humana?'
            : '¿Cuál es la idea principal de este tema?'}
        </p>
        <div className="journey-option">
          <span className="journey-radio" />{' '}
          {sample ? 'Su orientación hacia un fin.' : 'Una respuesta basada en tu material.'}
        </div>
        <div className="journey-option">
          <span className="journey-radio" />{' '}
          {sample ? 'Únicamente el resultado producido.' : 'Otra interpretación del concepto.'}
        </div>
      </div>
    );
  return (
    <div className="journey-example" data-kind="errors">
      <div className="journey-example-label">
        <Lightbulb size={16} /> Mis errores
      </div>
      <div className="journey-saved-topic">
        <strong>Un concepto para reforzar</strong>
      </div>
      <div className="journey-help-example">
        <Lightbulb size={18} />
        <div>
          <strong>Ayudame a entenderlo</strong>
        </div>
      </div>
      <div className="journey-check-example">
        <CircleCheck size={16} aria-hidden="true" />
        <span>Comprobalo con otra pregunta</span>
      </div>
    </div>
  );
}

export function PdfProcessingJourney({
  scene,
  complete,
  onStartDiagnostic,
  onStartSummary,
  onViewTools,
  waitingForProcessing = false,
  fileName = 'Derecho penal · Unidad 2.pdf',
  documentPreview,
  sample = true,
  progress,
  processingMessage,
}: {
  scene: number;
  complete: boolean;
  onStartDiagnostic: () => void;
  onStartSummary: () => void;
  onViewTools: () => void;
  waitingForProcessing?: boolean;
  fileName?: string;
  documentPreview?: ReactNode;
  sample?: boolean;
  progress?: number;
  processingMessage?: string;
}) {
  const active = processingScenes[Math.max(0, Math.min(2, scene))];
  const currentStep = complete ? 0 : scene;
  return (
    <section
      className="pdf-processing-journey"
      aria-label="Preparación del PDF"
      data-complete={complete}
      data-waiting={!complete && waitingForProcessing}
    >
      <div className="journey-processing-status">
        <div className="journey-status-icon" aria-hidden="true">
          {complete ? (
            <Check size={19} />
          ) : (
            <span className="journey-spinner">
              <Loader2 size={19} />
            </span>
          )}
        </div>
        <div>
          <strong>{complete ? 'Tu PDF está listo' : 'Preparando tu PDF'}</strong>
          <span aria-live="polite">
            {complete
              ? 'Ya podés empezar a estudiar con este material.'
              : waitingForProcessing
                ? 'Seguimos preparando tu PDF.'
                : 'Mientras tanto, conocé cómo estudiar con Evaluo.'}
          </span>
        </div>
      </div>
      {!complete && (
        <div
          className="journey-processing-line"
          role="progressbar"
          aria-label={processingMessage || 'Procesamiento en curso'}
          aria-valuemin={progress === undefined ? undefined : 0}
          aria-valuemax={progress === undefined ? undefined : 100}
          aria-valuenow={progress}
        >
          <span />
        </div>
      )}
      <div className="journey-layout">
        <div className="journey-pdf-column">
          {documentPreview ?? (
            <div className="journey-document" aria-hidden="true">
              <div className="journey-document-top">
                <span>APUNTES DE DERECHO PENAL</span>
                <FileText size={20} />
              </div>
              <h2>
                Teoría de
                <br />
                la acción
              </h2>
              <div className="journey-document-rule" />
              <p className="journey-document-section">1. El finalismo</p>
              <p className="journey-document-paragraph">
                La acción humana se caracteriza por su orientación hacia un fin. La persona anticipa
                un objetivo y dirige su conducta para alcanzarlo.
              </p>
              <div className="journey-document-highlight">
                La finalidad forma parte de la acción.
              </div>
              <div className="journey-document-bottom">
                <span>Unidad 2</span>
                <span>12</span>
              </div>
            </div>
          )}
          <div className="journey-filename">
            <FileText size={17} />
            <div>
              <strong>{fileName}</strong>
              <span>Tu mismo material, en todo el recorrido.</span>
            </div>
          </div>
        </div>
        <div className="journey-content-column">
          {complete ? (
            <div className="journey-complete" role="status">
              <h1>¿Por dónde querés empezar?</h1>
              <p>Descubrí qué temas ya manejás y cuáles te conviene repasar.</p>
              <button className="journey-start-button" type="button" onClick={onStartDiagnostic}>
                Ver qué tanto sé <ArrowRight size={16} />
              </button>
              <button className="journey-summary-button" type="button" onClick={onStartSummary}>
                Empezar por el resumen
              </button>
              <button className="journey-tools-button" type="button" onClick={onViewTools}>
                Ver todas las herramientas
              </button>
            </div>
          ) : (
            <>
              <div
                className="journey-scene-copy"
                key={`copy-${scene}`}
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="journey-eyebrow">{active.label}</span>
                <h1>{active.title}</h1>
                <p>{active.description}</p>
              </div>
              <div className="journey-visual-result" key={`visual-${scene}`}>
                <SceneExample scene={scene} sample={sample} />
              </div>
            </>
          )}
        </div>
      </div>
      <ol className="journey-cycle" aria-label="Tu recorrido de estudio">
        {processingScenes.map((item, index) => (
          <li
            key={item.label}
            aria-current={currentStep === index ? 'step' : undefined}
            data-active={currentStep === index}
          >
            <span className="journey-cycle-number">{index + 1}</span>
            <span>{item.label}</span>
            {index < 2 && <ArrowRight size={16} aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </section>
  );
}
