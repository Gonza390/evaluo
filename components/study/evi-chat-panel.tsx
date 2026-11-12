'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, FileText, X } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { askEviAction } from '@/lib/actions/evi-chat';
import {
  EVI_CHAT_MAX_MESSAGE_CHARS,
  eviChatSuggestions,
  type EviChatContext,
  type EviChatMessage,
} from '@/lib/evi-chat-contract';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { cn } from '@/lib/utils';
import './evi-chat.css';

type ChatEntry = EviChatMessage & { page?: number | null };

function storageKey(context: EviChatContext) {
  const base =
    context.kind === 'error'
      ? `error:${context.errorId}`
      : `practice:${context.materialId}:${context.question.slice(0, 120)}`;
  return `evaluo:evi-chat:${base}`;
}

function readSaved(key: string): ChatEntry[] {
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (item): item is ChatEntry =>
              Boolean(item) &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.text === 'string'
          )
          .slice(-12)
      : [];
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
  const [notice, setNotice] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const key = storageKey(context);

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

  const send = useCallback(
    async (text: string, suggestion = false) => {
      const message = text.trim().slice(0, EVI_CHAT_MAX_MESSAGE_CHARS);
      if (message.length < 2 || pending) return;
      const history = entries.map(({ role, text: body }) => ({ role, text: body }));
      const next: ChatEntry[] = [...entries, { role: 'user', text: message }];
      setEntries(next);
      setDraft('');
      setNotice('');
      setPending(true);
      const reply = await askEviAction({ context, history, message, suggestion }).catch(() => null);
      setPending(false);
      if (!reply || !reply.success) {
        setNotice(
          reply?.message ??
            (english
              ? 'Evi could not answer right now. Try again in a few seconds.'
              : 'Evi no pudo responder ahora. Probá de nuevo en unos segundos.')
        );
        // La pregunta no respondida vuelve al campo para no perderla.
        setEntries(entries);
        setDraft(message);
        return;
      }
      const answered: ChatEntry[] = [
        ...next,
        { role: 'assistant', text: reply.text, page: reply.page },
      ];
      setEntries(answered);
      saveEntries(key, answered);
      setRemaining(reply.remaining);
    },
    [context, english, entries, key, pending]
  );

  if (!mounted) return null;
  const suggestions = eviChatSuggestions(chosen, english);

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
            <img src="/evi-avatar.svg" alt="" className="size-12" />
            <h2 className="text-titulo-sm text-foreground tracking-titulo mt-3 font-semibold">
              {english
                ? 'Ask me anything about this question'
                : 'Preguntame lo que quieras sobre esta pregunta'}
            </h2>
            <p className="text-ui text-muted-foreground mt-2 max-w-[290px] leading-6">
              {english
                ? 'I answer with your notes and tell you which page it comes from.'
                : 'Te contesto con tu apunte y te digo de qué página sale cada respuesta.'}
            </p>
            <div className="mt-5 flex flex-col items-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={pending}
                  onClick={() => void send(suggestion, true)}
                  className="border-border text-ui text-foreground/80 hover:bg-muted min-h-10 rounded-full border bg-white px-4 disabled:opacity-50"
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
                  className="bg-muted text-ui text-foreground ml-auto max-w-[85%] rounded-2xl px-4 py-2.5 break-words"
                >
                  <span className="sr-only">{english ? 'You: ' : 'Vos: '}</span>
                  {entry.text}
                </li>
              ) : (
                <li key={index} className="flex gap-3">
                  <img src="/evi-avatar.svg" alt="" className="mt-0.5 size-7 shrink-0" />
                  <div className="min-w-0">
                    <span className="sr-only">Evi: </span>
                    <p className="text-cuerpo text-foreground leading-7 break-words whitespace-pre-line">
                      {entry.text}
                    </p>
                    {entry.page ? (
                      <p className="text-chico text-muted-foreground mt-2 inline-flex items-center gap-1.5">
                        <FileText className="text-primary size-3.5" aria-hidden="true" />
                        {english
                          ? `From page ${entry.page} of your notes`
                          : `Sale de la página ${entry.page} de tu apunte`}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            )}
          </ol>
        )}
        {pending ? (
          <p className="text-ui text-muted-foreground mt-4 flex items-center gap-3" role="status">
            <img src="/evi-avatar.svg" alt="" className="size-7" />
            {english ? 'Evi is thinking…' : 'Evi está pensando…'}
          </p>
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
