'use client';

import { useEffect, useRef, useState } from 'react';

/** Ejemplo preparado: no usa IA ni registra resultados académicos. */
export function HomeRedesignDemo() {
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
        Pregunta · Posicionamiento
      </div>
      <h3 ref={questionRef} tabIndex={-1} style={{ fontSize: 19, letterSpacing: '-.03em' }}>
        {retry
          ? 'Una marca quiere ser reconocida como la opción más confiable. ¿Qué está definiendo?'
          : '¿Qué lugar busca ocupar una marca frente a sus alternativas?'}
      </h3>
      {retry && !selected ? (
        <fieldset className="reference-demo-options">
          <legend className="sr-only">Elegí una respuesta</legend>
          {['Mercado meta', 'Posicionamiento', 'Segmentación'].map((option) => (
            <button key={option} type="button" className="btn" onClick={() => setSelected(option)}>
              {option}
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
            Tu respuesta: {selected ?? 'Mercado meta'} · {correct ? 'correcto.' : 'todavía no.'}
          </div>
          <p style={{ fontSize: 13, margin: '14px 0' }}>
            Mercado meta es el grupo al que apuntás. El posicionamiento es el lugar que ocupás
            frente a las alternativas.
          </p>
          <div className="reference-demo-level">
            Posicionamiento: <b>{correct ? '70%' : '55%'}</b> ·{' '}
            {correct ? 'respuesta correcta.' : 'te falta repasar este concepto.'}
            {!correct && (
              <>
                <br />
                Después de repasar y volver a probar: <b>70%</b>
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
          Ver en mi apunte
        </button>
        <button
          type="button"
          className="btn g"
          onClick={() => {
            setRetry(true);
            setSelected(null);
          }}
        >
          Probar de nuevo
        </button>
      </div>
      <blockquote hidden={!sourceOpen} id="reference-demo-source" className="reference-demo-source">
        <b>Apunte · Marketing I</b>
        <p>
          El posicionamiento es el lugar que una marca busca ocupar en la mente del consumidor en
          relación con sus alternativas. El mercado meta es el grupo de consumidores al que dirige
          su propuesta.
        </p>
      </blockquote>
    </div>
  );
}
