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
import type { AppLocale } from '@/lib/i18n/app-locale';
import './pdf-processing.css';

const PROCESSING_ENGLISH: Record<string, string> = {
  "Entender": "Understand",
  "Encontrá por dónde empezar.": "Find where to start.",
  "Tu PDF se transforma en un resumen por temas para saber qué estudiar.": "Your PDF becomes a topic-by-topic summary to guide your studies.",
  "Practicar": "Practice",
  "Comprobá qué entendiste.": "Check what you understand.",
  "Después, practicá con preguntas de este mismo PDF para descubrir qué entendiste.": "Then practice with questions based on your PDF to check what you understood.",
  "Reforzar": "Review",
  "Evaluo recuerda lo que te cuesta": "Evaluo remembers what you find difficult",
  "Tus errores quedan guardados para que puedas entenderlos con tu PDF y volver a comprobarlos.": "Your mistakes are saved so you can review them with the original PDF and try again.",
  "Temas principales": "Main topics",
  "La conducta y su finalidad": "Conduct and purpose",
  "La culpabilidad": "Culpability",
  "Tema principal de tu PDF": "Main topic from your PDF",
  "Otro concepto clave": "Another key concept",
  "Práctica con tu PDF": "Practice with your PDF",
  "Según el finalismo, ¿qué caracteriza a la acción humana?": "According to finalism, what characterizes human action?",
  "¿Cuál es la idea principal de este tema?": "What is the main idea of this topic?",
  "Su orientación hacia un fin.": "Its orientation toward an objective.",
  "Una respuesta basada en tu material.": "An answer based on your material.",
  "Únicamente el resultado producido.": "Only the outcome of the action.",
  "Otra interpretación del concepto.": "A different interpretation of the concept.",
  "Progreso": "Progress",
  "Un concepto para reforzar": "A concept to review",
  "Ayudame a entenderlo": "Help me understand it",
  "Comprobalo con otra pregunta": "Check it with another question",
  "Preparación del PDF": "Preparing your PDF",
  "Tu PDF está listo": "Your PDF is ready",
  "Preparando tu PDF": "Preparing your PDF",
  "Ya podés empezar a estudiar con este material.": "You can start studying with this material.",
  "Seguimos preparando tu PDF.": "We're still preparing your PDF.",
  "Mientras tanto, conocé cómo estudiar con Evaluo.": "Meanwhile, see how you can study with Evaluo.",
  "Procesamiento en curso": "Processing in progress",
  "APUNTES DE DERECHO PENAL": "CRIMINAL LAW NOTES",
  "Teoría de": "Theory of",
  "la acción": "action",
  "1. El finalismo": "1. Finalism",
  "La acción humana se caracteriza por su orientación hacia un fin. La persona anticipa un objetivo y dirige su conducta para alcanzarlo.": "Human action is oriented toward a goal. A person anticipates an objective and directs their behavior to achieve it.",
  "La finalidad forma parte de la acción.": "Purpose is part of an action.",
  "Unidad 2": "Unit 2",
  "Tu mismo material, en todo el recorrido.": "The same source material, every step of the way.",
  "Empecemos por lo más importante": "Let's start with what matters most",
  "¿Por dónde querés empezar?": "Where would you like to start?",
  "Primero entendé los temas principales de tu PDF. Después, ponete a prueba.": "First understand the main topics of your PDF. Then test yourself.",
  "Descubrí qué temas ya manejás y cuáles te conviene repasar.": "Find out which topics you already understand and which need review.",
  "Empezar a estudiar": "Start studying",
  "Ver qué tanto sé": "Check what I know",
  "Empezar por el resumen": "Start with the summary",
  "Ver todas las herramientas": "See all study tools",
  "Tu recorrido de estudio": "Your study journey"
};

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

function SceneExample({ scene, sample, locale = 'es' }: { scene: number; sample: boolean; locale?: AppLocale }) {
  const t = (text: string) => locale === 'en' ? PROCESSING_ENGLISH[text] ?? text : text;
  if (scene === 0)
    return (
      <div className="journey-example">
        <div className="journey-example-label">
          <BookOpen size={16} /> {t("Temas principales")}
        </div>
        <ol className="journey-topics">
          {(sample
            ? [t("La conducta y su finalidad"), t("La culpabilidad")]
            : [t("Tema principal de tu PDF"), t("Otro concepto clave")]
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
          <BookOpen size={16} /> {t("Práctica con tu PDF")}
        </div>
        <p className="journey-question">
          {sample
            ? t("Según el finalismo, ¿qué caracteriza a la acción humana?")
            : t("¿Cuál es la idea principal de este tema?")}
        </p>
        <div className="journey-option">
          <span className="journey-radio" />{' '}
          {sample ? t("Su orientación hacia un fin.") : t("Una respuesta basada en tu material.")}
        </div>
        <div className="journey-option">
          <span className="journey-radio" />{' '}
          {sample ? t("Únicamente el resultado producido.") : t("Otra interpretación del concepto.")}
        </div>
      </div>
    );
  return (
    <div className="journey-example" data-kind="errors">
      <div className="journey-example-label">
        <Lightbulb size={16} /> {t("Progreso")}
      </div>
      <div className="journey-saved-topic">
        <strong>{t("Un concepto para reforzar")}</strong>
      </div>
      <div className="journey-help-example">
        <Lightbulb size={18} />
        <div>
          <strong>{t("Ayudame a entenderlo")}</strong>
        </div>
      </div>
      <div className="journey-check-example">
        <CircleCheck size={16} aria-hidden="true" />
        <span>{t("Comprobalo con otra pregunta")}</span>
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
  firstPdf = false,
  locale = 'es',
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
  firstPdf?: boolean;
  locale?: AppLocale;
}) {
  const t = (text: string) => locale === 'en' ? PROCESSING_ENGLISH[text] ?? text : text;
  const scenes = locale === 'en' ? processingScenes.map(item => ({
    label: t(item.label), title: t(item.title), description: t(item.description),
  })) : processingScenes;
  const active = scenes[Math.max(0, Math.min(2, scene))];
  const currentStep = complete ? 0 : scene;
  return (
    <section
      className="pdf-processing-journey"
      aria-label={t("Preparación del PDF")}
      data-complete={complete}
      data-first-pdf={firstPdf}
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
          <strong>{complete ? t("Tu PDF está listo") : t("Preparando tu PDF")}</strong>
          <span aria-live="polite">
            {complete
              ? t("Ya podés empezar a estudiar con este material.")
              : waitingForProcessing
                ? t("Seguimos preparando tu PDF.")
                : t("Mientras tanto, conocé cómo estudiar con Evaluo.")}
          </span>
        </div>
      </div>
      {!complete && (
        <div
          className="journey-processing-line"
          role="progressbar"
          aria-label={t(processingMessage || "Procesamiento en curso")}
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
                <span>{t("APUNTES DE DERECHO PENAL")}</span>
                <FileText size={20} />
              </div>
              <h2>
                {t("Teoría de")}
                <br />
                {t("la acción")}
              </h2>
              <div className="journey-document-rule" />
              <p className="journey-document-section">{t("1. El finalismo")}</p>
              <p className="journey-document-paragraph">
                {t("La acción humana se caracteriza por su orientación hacia un fin. La persona anticipa un objetivo y dirige su conducta para alcanzarlo.")}
              </p>
              <div className="journey-document-highlight">
                {t("La finalidad forma parte de la acción.")}
              </div>
              <div className="journey-document-bottom">
                <span>{t("Unidad 2")}</span>
                <span>12</span>
              </div>
            </div>
          )}
          <div className="journey-filename">
            <FileText size={17} />
            <div>
              <strong>{fileName}</strong>
              <span>{t("Tu mismo material, en todo el recorrido.")}</span>
            </div>
          </div>
        </div>
        <div className="journey-content-column">
          {complete ? (
            <div className="journey-complete" role="status">
              <h1>{firstPdf ? t("Empecemos por lo más importante") : t("¿Por dónde querés empezar?")}</h1>
              <p>
                {firstPdf
                  ? t("Primero entendé los temas principales de tu PDF. Después, ponete a prueba.")
                  : t("Descubrí qué temas ya manejás y cuáles te conviene repasar.")}
              </p>
              <button
                className="journey-start-button"
                type="button"
                onClick={firstPdf ? onStartSummary : onStartDiagnostic}
              >
                {firstPdf ? t("Empezar a estudiar") : t("Ver qué tanto sé")} <ArrowRight size={16} />
              </button>
              {!firstPdf && (
                <button className="journey-summary-button" type="button" onClick={onStartSummary}>
                  {t("Empezar por el resumen")}
                </button>
              )}
              <button className="journey-tools-button" type="button" onClick={onViewTools}>
                {t("Ver todas las herramientas")}
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
                <SceneExample scene={scene} sample={sample} locale={locale} />
              </div>
            </>
          )}
        </div>
      </div>
      <ol className="journey-cycle" aria-label={t("Tu recorrido de estudio")}>
        {scenes.map((item, index) => (
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
