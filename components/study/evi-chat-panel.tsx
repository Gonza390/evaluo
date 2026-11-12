'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, FileText, X } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import {
  EVI_CHAT_MAX_MESSAGE_CHARS,
  eviChatSuggestions,
  type EviChatContext,
  type EviChatMessage,
} from '@/lib/evi-chat-contract';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { cn } from '@/lib/utils';
import './evi-chat.css';

type QuizEntry = {
  role: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
  answer: number | null;
  page?: number | null;
};
type ChatEntry =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; page?: number | null }
  | QuizEntry;

const QUIZ_SUGGESTION = { es: 'Haceme una pregunta parecida', en: 'Ask me a similar question' };

function storageKey(context: EviChatContext) {
  const base =
    context.kind === 'error'
      ? `error:${context.errorId}`
      : `practice:${context.materialId}:${context.question.slice(0, 120)}`;
  return `evaluo:evi-chat:${base}`;
}

function isEntry(item: unknown): item is ChatEntry {
  if (!item || typeof item !== 'object') return false;
  const entry = item as Record<string, unknown>;
  if (entry.role === 'user' || entry.role === 'assistant') return typeof entry.text === 'string';
  return (
    entry.role === 'quiz' &&
    typeof entry.question === 'string' &&
    Array.isArray(entry.options) &&
    typeof entry.correctIndex === 'number'
  );
}

function readSaved(key: string): ChatEntry[] {
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isEntry).slice(-12) : [];
  } catch {
    return [];
  }
}

function saveEntries(key: string, entries: ChatEntry[]) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(entries.slice(-12)));
  } catch {
    // Sin almacenamiento la charla sigue funcionando mientras el panel esté abierto.
  }
}

/** Lo que viaja al servidor como contexto de la charla (texto plano). */
function toHistory(entries: ChatEntry[]): EviChatMessage[] {
  return entries.map((entry) =>
    entry.role === 'quiz'
      ? {
          role: 'assistant' as const,
          text: `${entry.question}\n${entry.options.map((o, i) => `${'ABC'[i]}) ${o}`).join('\n')}`,
        }
      : { role: entry.role, text: entry.text }
  );
}

function PageNote({ page, english }: { page: number; english: boolean }) {
  return (
    <p className="evi-rise text-chico text-muted-foreground mt-2 inline-flex items-center gap-1.5">
      <FileText className="text-primary size-3.5" aria-hidden="true" />
      {english ? `From page ${page} of your notes` : `Sale de la página ${page} de tu apunte`}
    </p>
  );
}

/**
 * "Preguntale a Evi": en compu entra desde la derecha y corre el contenido;
 * en el celular sube a pantalla completa. Se cierra con la X o con Esc.
 */
export function EviChatPanel({
  open,
  onClose,
  context,
  chosen,
}: {
  open: boolean;
  onClose: () => void;
  context: EviChatContext;
  chosen?: string | null;
}) {
  const english = useOptionalAppLocale() === 'en';
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [slow, setSlow] = useState(false);
  const [notice, setNotice] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const key = storageKey(context);
  const quizSuggestion = english ? QUIZ_SUGGESTION.en : QUIZ_SUGGESTION.es;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setEntries(readSaved(key));
      const frame = requestAnimationFrame(() => setVisible(true));
      document.documentElement.classList.add('evi-chat-open');
      trackMarketingEvent('evi_chat_opened', {
        context_kind: context.kind,
        material_id:
          context.kind === 'practice' ? context.materialId : (context.materialId ?? null),
      });
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    document.documentElement.classList.remove('evi-chat-open');
    const timer = window.setTimeout(() => setMounted(false), 260);
    return () => window.clearTimeout(timer);
    // El contexto no cambia mientras el panel está abierto.
  }, [open, key]);

  useEffect(() => () => document.documentElement.classList.remove('evi-chat-open'), []);

  useEffect(() => {
    if (!visible) return;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [entries, pending]);

  // Si tarda, contamos lo que está haciendo: buscar en el apunte.
  useEffect(() => {
    if (!pending) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), 3000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const fail = useCallback((previous: ChatEntry[], message: string, restore: string) => {
    setEntries(previous);
    setNotice(message);
    setDraft(restore);
  }, []);

  const send = useCallback(
    async (text: string, suggestion = false) => {
      const message = text.trim().slice(0, EVI_CHAT_MAX_MESSAGE_CHARS);
      if (message.length < 2 || pending) return;
      const quiz = message === quizSuggestion;
      const previous = entries;
      const withQuestion: ChatEntry[] = [...entries, { role: 'user', text: message }];
      const fallbackMessage = english
        ? 'Evi could not answer right now. Try again in a few seconds.'
        : 'Evi no pudo responder ahora. Probá de nuevo en unos segundos.';
      setEntries(withQuestion);
      setDraft('');
      setNotice('');
      setPending(true);
      try {
        const response = await fetch('/api/evi-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: quiz ? 'quiz' : 'chat',
            context,
            history: toHistory(entries),
            message,
            suggestion,
          }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          fail(previous, data?.message ?? fallbackMessage, quiz ? '' : message);
          return;
        }
        if (quiz) {
          const data = (await response.json()) as {
            quiz: { question: string; options: string[]; correctIndex: number; feedback: string };
            page: number | null;
            remaining: number | null;
          };
          const done: ChatEntry[] = [
            ...withQuestion,
            { role: 'quiz', ...data.quiz, answer: null, page: data.page },
          ];
          setEntries(done);
          saveEntries(key, done);
          setRemaining(data.remaining);
          return;
        }
        const pageHeader = Number(response.headers.get('X-Evi-Page'));
        const page = Number.isInteger(pageHeader) && pageHeader > 0 ? pageHeader : null;
        const left = response.headers.get('X-Evi-Remaining');
        const reader = response.body?.getReader();
        if (!reader) {
          fail(previous, fallbackMessage, message);
          return;
        }
        const decoder = new TextDecoder();
        let answer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          if (answer.startsWith('\u0000')) continue;
          setEntries([...withQuestion, { role: 'assistant', text: answer }]);
        }
        if (!answer.trim() || answer.startsWith('\u0000')) {
          fail(previous, answer.slice(1) || fallbackMessage, message);
          return;
        }
        const done: ChatEntry[] = [
          ...withQuestion,
          { role: 'assistant', text: answer.trim(), page },
        ];
        setEntries(done);
        saveEntries(key, done);
        setRemaining(left ? Number(left) : null);
      } catch {
        fail(previous, fallbackMessage, quiz ? '' : message);
      } finally {
        setPending(false);
      }
    },
    [context, english, entries, fail, key, pending, quizSuggestion]
  );

  const answerQuiz = (index: number, choice: number) => {
    setEntries((current) => {
      const next = current.map((entry, i) =>
        i === index && entry.role === 'quiz' && entry.answer === null
          ? { ...entry, answer: choice }
          : entry
      );
      saveEntries(key, next);
      return next;
    });
  };

  if (!mounted) return null;
  const suggestions = eviChatSuggestions(chosen, english);
  const last = entries[entries.length - 1];
  const streamingStarted = pending && last?.role === 'assistant';
  const showFollowUps =
    !pending &&
    last &&
    (last.role === 'assistant' || (last.role === 'quiz' && last.answer !== null));
  const followUps = english
    ? ['Another example', 'Explain it more simply']
    : ['Otro ejemplo', 'Más simple'];

  return createPortal(
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={english ? 'Ask Evi' : 'Preguntale a Evi'}
      data-evi-chat-panel
      className={cn(
        'bg-background fixed inset-0 z-[60] flex flex-col transition-transform duration-[250ms] ease-out motion-reduce:transition-none',
        'lg:border-border lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] lg:border-l lg:shadow-[-12px_0_32px_rgba(15,23,42,0.06)]',
        visible
          ? 'translate-x-0 translate-y-0'
          : 'translate-y-full lg:translate-x-full lg:translate-y-0'
      )}
    >
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          aria-label={english ? 'Close chat' : 'Cerrar el chat'}
          className="text-muted-foreground hover:text-foreground flex size-11 items-center justify-center rounded-full"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-4" aria-live="polite">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center pt-2 text-center">
            <img src="/evi-avatar.svg" alt="" className={cn('size-12', visible && 'evi-pop')} />
            <h2
              className={cn(
                'text-titulo-sm text-foreground tracking-titulo mt-3 font-semibold',
                visible && 'evi-rise'
              )}
              style={{ '--evi-step': 0 } as CSSProperties}
            >
              {english
                ? 'Ask me anything about this question'
                : 'Preguntame lo que quieras sobre esta pregunta'}
            </h2>
            <p
              className={cn(
                'text-ui text-muted-foreground mt-2 max-w-[290px] leading-6',
                visible && 'evi-rise'
              )}
              style={{ '--evi-step': 1 } as CSSProperties}
            >
              {english
                ? 'I answer with your notes and tell you which page it comes from.'
                : 'Te contesto con tu apunte y te digo de qué página sale cada respuesta.'}
            </p>
            <div className="mt-5 flex flex-col items-center gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={pending}
                  onClick={() => void send(suggestion, true)}
                  style={{ '--evi-step': index + 2 } as CSSProperties}
                  className={cn(
                    'border-border text-ui text-foreground/80 hover:bg-muted min-h-10 rounded-full border bg-white px-4 disabled:opacity-50',
                    visible && 'evi-rise'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {entries.map((entry, index) =>
              entry.role === 'user' ? (
                <li
                  key={index}
                  className="evi-rise bg-muted text-ui text-foreground ml-auto max-w-[85%] rounded-2xl px-4 py-2.5 break-words"
                >
                  <span className="sr-only">{english ? 'You: ' : 'Vos: '}</span>
                  {entry.text}
                </li>
              ) : entry.role === 'assistant' ? (
                <li key={index} className="flex gap-3">
                  <img src="/evi-avatar.svg" alt="" className="mt-0.5 size-7 shrink-0" />
                  <div className="min-w-0">
                    <span className="sr-only">Evi: </span>
                    <p className="text-cuerpo text-foreground leading-7 break-words whitespace-pre-line">
                      {entry.text}
                    </p>
                    {entry.page ? <PageNote page={entry.page} english={english} /> : null}
                  </div>
                </li>
              ) : (
                <li key={index} className="evi-rise flex gap-3" data-evi-quiz>
                  <img src="/evi-avatar.svg" alt="" className="mt-0.5 size-7 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-cuerpo text-foreground leading-7 font-medium break-words">
                      {entry.question}
                    </p>
                    <div
                      className="mt-3 flex flex-col gap-2"
                      role="group"
                      aria-label={english ? 'Options' : 'Opciones'}
                    >
                      {entry.options.map((option, choice) => {
                        const answered = entry.answer !== null;
                        const state = !answered
                          ? 'idle'
                          : choice === entry.correctIndex
                            ? 'correct'
                            : choice === entry.answer
                              ? 'wrong'
                              : 'other';
                        return (
                          <button
                            key={choice}
                            type="button"
                            disabled={answered}
                            onClick={() => answerQuiz(index, choice)}
                            className={cn(
                              'text-ui flex min-h-11 items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition',
                              state === 'idle' && 'border-border hover:border-primary/40 bg-white',
                              state === 'correct' && 'border-emerald-500 bg-emerald-50',
                              state === 'wrong' && 'border-destructive bg-destructive/5',
                              state === 'other' && 'border-border text-muted-foreground bg-white'
                            )}
                          >
                            <span className="text-muted-foreground font-semibold">
                              {'ABC'[choice]}
                            </span>
                            <span className="min-w-0 break-words">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                    {entry.answer !== null ? (
                      <div className="evi-rise mt-3">
                        <p
                          className={cn(
                            'text-ui font-semibold',
                            entry.answer === entry.correctIndex
                              ? 'text-emerald-700'
                              : 'text-destructive'
                          )}
                        >
                          {entry.answer === entry.correctIndex
                            ? english
                              ? 'Correct! You got it.'
                              : '¡Bien! Lo entendiste.'
                            : english
                              ? `Not quite: it was ${'ABC'[entry.correctIndex]}.`
                              : `No era esa: era la ${'ABC'[entry.correctIndex]}.`}
                        </p>
                        <p className="text-cuerpo text-foreground/80 mt-1 leading-7 break-words">
                          {entry.feedback}
                        </p>
                        {entry.page ? <PageNote page={entry.page} english={english} /> : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              )
            )}
          </ol>
        )}
        {pending && !streamingStarted ? (
          <div
            className="evi-rise text-ui text-muted-foreground mt-4 flex items-center gap-3"
            role="status"
          >
            <img src="/evi-pensando.svg" alt="" className="evi-bob size-8" />
            <span>
              {slow
                ? english
                  ? 'Searching your notes'
                  : 'Buscando en tu apunte'
                : english
                  ? 'Evi is thinking'
                  : 'Evi está pensando'}
            </span>
            <span aria-hidden="true" className="inline-flex gap-1">
              <span className="evi-dot bg-muted-foreground size-1.5 rounded-full" />
              <span className="evi-dot bg-muted-foreground size-1.5 rounded-full" />
              <span className="evi-dot bg-muted-foreground size-1.5 rounded-full" />
            </span>
          </div>
        ) : null}
        {showFollowUps ? (
          <div className="evi-rise mt-4 flex flex-wrap gap-2 pl-10">
            {followUps.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => void send(label, true)}
                className="border-border text-chico text-foreground/80 hover:bg-muted min-h-9 rounded-full border bg-white px-3"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              data-evi-understood
              className="border-primary/30 text-chico text-primary hover:bg-primary/5 min-h-9 rounded-full border bg-white px-3 font-medium"
            >
              {english ? 'Got it →' : 'Ya entendí →'}
            </button>
          </div>
        ) : null}
      </div>

      <form
        className="px-4 pb-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        {notice ? (
          <p role="alert" className="text-chico text-destructive mb-2 px-1">
            {notice}
          </p>
        ) : remaining !== null && remaining <= 2 ? (
          <p className="text-chico text-muted-foreground mb-2 px-1">
            {english
              ? `${remaining} question${remaining === 1 ? '' : 's'} left today`
              : `Te ${remaining === 1 ? 'queda 1 pregunta' : `quedan ${remaining} preguntas`} hoy`}
          </p>
        ) : null}
        {context.label ? (
          <p className="text-etiqueta text-muted-foreground mb-2 truncate px-2">{context.label}</p>
        ) : null}
        <div className="border-border flex items-center gap-2 rounded-full border bg-white py-1.5 pr-1.5 pl-4">
          <label htmlFor={inputId} className="sr-only">
            {english ? 'Your question' : 'Tu pregunta'}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            value={draft}
            maxLength={EVI_CHAT_MAX_MESSAGE_CHARS}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={english ? 'Ask me something' : 'Preguntame algo'}
            autoComplete="off"
            className="text-ui text-foreground min-w-0 flex-1 bg-transparent outline-none"
          />
          <button
            type="submit"
            aria-label={english ? 'Send' : 'Enviar'}
            disabled={pending || draft.trim().length < 2}
            className="bg-primary flex size-10 shrink-0 items-center justify-center rounded-full text-white transition disabled:bg-slate-300"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </aside>,
    document.body
  );
}

/** Botón "Preguntale a Evi" con su panel. Desaparece mientras el chat está abierto. */
export function EviChatLauncher({
  context,
  chosen,
  className,
}: {
  context: EviChatContext;
  chosen?: string | null;
  className?: string;
}) {
  const english = useOptionalAppLocale() === 'en';
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => button.current?.focus({ preventScroll: true }));
  }, []);
  return (
    <>
      {!open ? (
        <button
          ref={button}
          type="button"
          onClick={() => setOpen(true)}
          data-evi-chat-open
          className={cn(
            'border-border text-foreground hover:bg-muted inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-medium',
            className
          )}
        >
          <img src="/evi-avatar.svg" alt="" className="size-5" />
          {english ? 'Ask Evi' : 'Preguntale a Evi'}
        </button>
      ) : null}
      <EviChatPanel open={open} onClose={close} context={context} chosen={chosen} />
    </>
  );
}
