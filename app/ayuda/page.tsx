'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleHelp, MessageSquareText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const feedbackCategories = [
  {
    id: 'problema',
    label: 'Tengo un problema',
    description: 'Algo no funciona como esperabas.',
  },
  {
    id: 'sugerencia',
    label: 'Sugerencia',
    description: 'Hay algo que podríamos mejorar.',
  },
  {
    id: 'contenido',
    label: 'Contenido',
    description: 'Encontraste algo incorrecto, confuso o desactualizado.',
  },
  {
    id: 'otro',
    label: 'Otro',
    description: 'Cualquier comentario que nos quieras dejar.',
  },
] as const;

type FeedbackCategory = (typeof feedbackCategories)[number]['id'];

function getOrCreateSessionKey() {
  const existing = window.localStorage.getItem('evaluo_session_key');
  if (existing) return existing;

  const created = `evaluo_${crypto.randomUUID()}`;
  window.localStorage.setItem('evaluo_session_key', created);
  return created;
}

export default function AyudaPage() {
  const [category, setCategory] = useState<FeedbackCategory>('sugerencia');
  const [message, setMessage] = useState('');
  const [sourcePath, setSourcePath] = useState('/dashboard');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from && from.startsWith('/') && from.length <= 240) {
      setSourcePath(from);
    }
  }, []);

  const selectedCategory = useMemo(
    () => feedbackCategories.find((item) => item.id === category) ?? feedbackCategories[0],
    [category]
  );

  const canSubmit = message.trim().length >= 3 && !sending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          source_path: sourcePath,
          session_key: getOrCreateSessionKey(),
        }),
      });

      if (!response.ok) {
        throw new Error('feedback_request_failed');
      }

      setMessage('');
      setSent(true);
    } catch {
      setError('No pudimos enviar tu comentario. Probá de nuevo en unos segundos.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="animate-page-enter mx-auto w-full max-w-6xl space-y-6">
      <section className="surface-panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-brand-2/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="from-brand to-brand-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
            <CircleHelp className="h-7 w-7" />
          </div>
          <div>
            <p className="eyebrow-label text-brand">Ayuda</p>
            <h1 className="text-heading mt-1 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
              ¿Cómo podemos mejorar Evaluo?
            </h1>
            <p className="section-copy mt-3 max-w-2xl">
              Contanos qué te pasó o qué te gustaría que cambiemos. Tu comentario llega con el
              contexto necesario para entender mejor dónde estabas y qué estabas haciendo.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="surface-panel p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <MessageSquareText className="text-brand h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-950">¿Sobre qué querés contarnos?</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Elegí la opción que mejor describa tu comentario. No hace falta que sea perfecto: lo
            importante es entender qué necesitabas.
          </p>

          <div className="mt-5 space-y-2.5">
            {feedbackCategories.map((item) => {
              const active = item.id === category;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCategory(item.id);
                    setSent(false);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-indigo-200 bg-indigo-50/70 shadow-[0_8px_22px_rgba(79,70,229,0.08)]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <p className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-slate-900'}`}>
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="surface-panel p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">{selectedCategory.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{selectedCategory.description}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
              1 minuto
            </span>
          </div>

          <label htmlFor="feedback-message" className="mt-6 block text-sm font-semibold text-slate-900">
            Contanos un poco más
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value.slice(0, 1200));
              setSent(false);
            }}
            rows={7}
            placeholder="Ej: En el simulador me gustaría poder entender por qué una respuesta es incorrecta sin tener que salir de la pregunta..."
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/70"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>Cuanto más concreto, mejor podemos entenderlo.</span>
            <span>{message.length}/1200</span>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold text-slate-700">Contexto incluido automáticamente</p>
            <p className="mt-1.5 break-all text-xs text-slate-500">
              Página de origen: <span className="font-medium text-slate-700">{sourcePath}</span>
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              También asociamos el comentario a tu sesión y cuenta para poder investigar el problema
              sin pedirte información técnica.
            </p>
          </div>

          {sent ? (
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Gracias. Recibimos tu comentario.</span>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="from-brand to-brand-2 mt-5 h-11 w-full rounded-xl bg-gradient-to-r text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,93,255,0.22)]"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Enviando...' : 'Enviar feedback'}
          </Button>
        </form>
      </section>
    </div>
  );
}
