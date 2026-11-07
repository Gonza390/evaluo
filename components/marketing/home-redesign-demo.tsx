'use client';

import { useEffect, useRef, useState } from 'react';

const EN_HOME_DEMO_COPY: Record<string, string> = {
  "Pregunta · Posicionamiento": "Question · Positioning",
  "Una marca quiere ser reconocida como la opción más confiable. ¿Qué está definiendo?": "A brand wants to be recognized as the most trustworthy option. What is it defining?",
  "¿Qué lugar busca ocupar una marca frente a sus alternativas?": "What place does a brand aim to occupy compared with competing options?",
  "Elegí una respuesta": "Choose an answer",
  "Mercado meta": "Target market",
  "Posicionamiento": "Positioning",
  "Segmentación": "Segmentation",
  "Tu respuesta:": "Your answer:",
  "correcto.": "correct.",
  "todavía no.": "not yet.",
  "Mercado meta es el grupo al que apuntás. El posicionamiento es el lugar que ocupás frente a las alternativas.": "The target market is the group you are trying to reach. Positioning is how a brand stands out compared with competing options.",
  "respuesta correcta.": "correct answer.",
  "te falta repasar este concepto.": "you should review this concept.",
  "Después de repasar y volver a probar:": "After reviewing and trying again:",
  "Ver en mi apunte": "View in my notes",
  "Probar de nuevo": "Try again",
  "Apunte · Marketing I": "Notes · Marketing I",
  "El posicionamiento es el lugar que una marca busca ocupar en la mente del consumidor en relación con sus alternativas. El mercado meta es el grupo de consumidores al que dirige su propuesta.": "Positioning is the place a brand aims to occupy in consumers' minds relative to competing options. The target market is the group of consumers the brand is trying to reach."
};

/** Ejemplo preparado: no usa IA ni registra resultados académicos. */
export function HomeRedesignDemo({ locale = 'es' }: { locale?: 'es' | 'en' }) {
  const english = locale === 'en';
  const t = (text: string) => english ? EN_HOME_DEMO_COPY[text] ?? text : text;
  const [retry, setRetry] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const correct = selected === 'Posicionamiento';
  const questionRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!retry) return;
    const target = selected ? feedbackRef.current : questionRef.current;
    target?.focus({ preventScroll: true });
  }, [retry, selected]);

  return (
    <div className="card reference-demo" style={{ padding: '22px 26px' }}>
      <div className="eb" style={{ marginBottom: 6 }}>
        {t("Pregunta · Posicionamiento")}
      </div>
      <h3 ref={questionRef} tabIndex={-1} style={{ fontSize: 19, letterSpacing: '-.03em' }}>
        {retry
          ? t("Una marca quiere ser reconocida como la opción más confiable. ¿Qué está definiendo?")
          : t("¿Qué lugar busca ocupar una marca frente a sus alternativas?")}
      </h3>
      {retry && !selected ? (
        <fieldset className="reference-demo-options">
          <legend className="sr-only">{t("Elegí una respuesta")}</legend>
          {['Mercado meta', 'Posicionamiento', 'Segmentación'].map((option) => (
            <button key={option} type="button" className="btn" onClick={() => setSelected(option)}>
              {t(option)}
            </button>
          ))}
        </fieldset>
      ) : (
        <>
          <div
            ref={feedbackRef}
            tabIndex={-1}
            role="status"
            className={`reference-demo-feedback ${correct ? 'is-correct' : ''}`}
          >
            {t('Tu respuesta:')} {t(selected ?? 'Mercado meta')} · {correct ? t("correcto.") : t("todavía no.")}
          </div>
          <p style={{ fontSize: 13, margin: '14px 0' }}>
            {t("Mercado meta es el grupo al que apuntás. El posicionamiento es el lugar que ocupás frente a las alternativas.")}
          </p>
          <div className="reference-demo-level">
            {t('Posicionamiento')}: <b>{correct ? '70%' : '55%'}</b> ·{' '}
            {correct ? t("respuesta correcta.") : t("te falta repasar este concepto.")}
            {!correct && (
              <>
                <br />
                {t("Después de repasar y volver a probar:")} <b>70%</b>
              </>
            )}
          </div>
        </>
      )}
      <div className="reference-demo-actions">
        <button
          type="button"
          className="btn"
          aria-expanded={sourceOpen}
          aria-controls="reference-demo-source"
          onClick={() => setSourceOpen(!sourceOpen)}
        >
          {t("Ver en mi apunte")}
        </button>
        <button
          type="button"
          className="btn g"
          onClick={() => {
            setRetry(true);
            setSelected(null);
          }}
        >
          {t("Probar de nuevo")}
        </button>
      </div>
      <blockquote hidden={!sourceOpen} id="reference-demo-source" className="reference-demo-source">
        <b>{t("Apunte · Marketing I")}</b>
        <p>
          {t("El posicionamiento es el lugar que una marca busca ocupar en la mente del consumidor en relación con sus alternativas. El mercado meta es el grupo de consumidores al que dirige su propuesta.")}
        </p>
      </blockquote>
    </div>
  );
}
