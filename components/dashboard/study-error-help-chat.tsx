'use client';

import { useEffect, useRef } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import type { ReviewHelpKind } from '@/lib/study-error-review-contract';
import { StudyErrorTutorAvatar } from './study-error-tutor-avatar';

export type StudyErrorHelpMessage = { kind: ReviewHelpKind; text: string };

// Navega dentro de la conversación sin desplazar la página ni los botones de ayuda.
export function scrollToStudyErrorHelp(container: HTMLElement, kind: ReviewHelpKind) {
  const turn = container.querySelector<HTMLElement>(`[data-study-chat-kind="${kind}"]`);
  if (!turn) return;
  container.scrollTo({
    top:
      container.scrollTop +
      turn.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      16,
    behavior: 'instant',
  });
}
const requests: Record<ReviewHelpKind, string> = {
  why_wrong: 'Ayudame a entenderlo',
  simpler: '¿Me lo explicás más simple?',
  example: 'Dame un ejemplo para entenderlo',
};

function TutorAnswer({ text }: Pick<StudyErrorHelpMessage, 'text'>) {
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);
  return (
    <div className="max-w-[72ch] space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="!text-foreground !text-base !leading-7 break-words whitespace-pre-line"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function StudyErrorHelpChat({
  messages,
  pendingKind,
  hasPdf,
  savedExplanation,
  onRequest,
  busy,
  resolved,
  topic,
  pdfTitle,
  notice,
}: {
  messages: StudyErrorHelpMessage[];
  pendingKind: ReviewHelpKind | null;
  hasPdf: boolean;
  savedExplanation?: string | null;
  onRequest: (kind: ReviewHelpKind) => void;
  busy: boolean;
  resolved: boolean;
  topic: string;
  pdfTitle: string | null;
  notice?: string;
}) {
  const conversation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!messages.length && !pendingKind) return;
    const latestKind = pendingKind ?? messages.at(-1)?.kind;
    if (conversation.current && latestKind)
      scrollToStudyErrorHelp(conversation.current, latestKind);
  }, [messages.length, pendingKind]);

  const turns = [
    ...messages.map((message) => ({ ...message, pending: false })),
    ...(pendingKind ? [{ kind: pendingKind, text: '', pending: true }] : []),
  ];
  const hasConversation = turns.length > 0;

  return (
    <div className="border-border overflow-hidden rounded-xl border [--study-chat-height:clamp(20rem,52svh,30rem)] sm:[--study-chat-height:clamp(22rem,56svh,32rem)] [@media(max-height:500px)]:[--study-chat-height:50svh]">
      <header className="border-border bg-muted/20 flex items-start gap-3 border-b px-4 py-4">
        <StudyErrorTutorAvatar prominent />
        <div className="min-w-0 flex-1">
          <p className="!text-primary !text-xs !leading-5 font-semibold">Evaluo</p>
          <h3 className="mt-0.5 text-base leading-6 font-semibold break-words sm:text-lg">
            Entendamos {topic}
          </h3>
          <p className="!text-muted-foreground mt-1.5 flex items-start gap-2 !text-sm !leading-5">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">
              {pdfTitle ?? 'Este error todavía no tiene un PDF asociado'}
            </span>
          </p>
        </div>
      </header>
      <div
        ref={conversation}
        data-study-chat-scroll
        tabIndex={0}
        className={`focus-visible:outline-ring overscroll-y-contain p-4 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${hasConversation ? 'h-[var(--study-chat-height)] overflow-y-auto' : 'py-5'}`}
        role="log"
        aria-label="Conversación con Evaluo"
        aria-live="polite"
        aria-relevant="additions"
      >
        {!turns.length && !savedExplanation && (
          <div className="flex items-start gap-2.5 sm:gap-3">
            <StudyErrorTutorAvatar />
            <div className="min-w-0 flex-1">
              <p className="!text-foreground mb-2 !text-sm font-semibold">Evaluo</p>
              <p className="!text-foreground max-w-[60ch] !text-base !leading-7 break-words">
                {resolved
                  ? 'Este error ya quedó resuelto. Podés consultar tu respuesta anterior o seguir con otro tema.'
                  : hasPdf
                    ? 'Podemos aclarar qué te confundió usando tus apuntes. Después podés pedir una versión más simple o un ejemplo.'
                    : 'Podemos aclarar qué te confundió con una explicación general. Para usar tus apuntes, asociá un PDF.'}
              </p>
              {!resolved && (
                <button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                  disabled={busy}
                  onClick={() => onRequest('why_wrong')}
                >
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Ayudame a entenderlo
                </button>
              )}
            </div>
          </div>
        )}
        <ol className="space-y-7 sm:space-y-8">
          {turns.map((turn, index) => (
            <li
              key={turn.kind}
              data-study-chat-kind={turn.kind}
              className="last:min-h-[calc(var(--study-chat-height)-2rem)]"
            >
              <div className="mb-5 flex justify-end">
                <div className="bg-primary/7 max-w-[90%] rounded-2xl rounded-br-md px-4 py-3 sm:max-w-[80%]">
                  <p className="!text-muted-foreground mb-1 !text-[11px] font-medium">Vos</p>
                  <p className="!text-foreground !text-sm !leading-6">{requests[turn.kind]}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <StudyErrorTutorAvatar state={turn.pending ? 'thinking' : 'answering'} />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold">Evaluo</span>
                    {index === 0 && (
                      <span className="text-muted-foreground text-xs">
                        {hasPdf ? 'Con tu PDF' : 'Sobre este concepto'}
                      </span>
                    )}
                  </div>
                  {turn.pending ? (
                    <p
                      className="!text-muted-foreground flex items-center gap-2 !text-sm"
                      role="status"
                    >
                      {hasPdf ? 'Estoy revisando tu PDF…' : 'Estoy preparando la explicación…'}
                    </p>
                  ) : (
                    <TutorAnswer text={turn.text} />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
        {!turns.length && savedExplanation && (
          <div className="flex items-start gap-2.5 sm:gap-3">
            <StudyErrorTutorAvatar />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="!text-muted-foreground !text-xs font-semibold">
                Explicación de la actividad
              </p>
              <TutorAnswer text={savedExplanation} />
            </div>
          </div>
        )}
      </div>
      {notice && (
        <p
          role="alert"
          className="border-destructive/40 !text-foreground mx-4 mb-4 border-l-2 pl-3 !text-sm"
        >
          {notice}
        </p>
      )}
      {messages.length > 0 && (
        <div
          role="group"
          aria-label="Opciones de la explicación"
          className="border-border bg-muted/20 grid grid-cols-2 items-center gap-2 border-t px-4 py-3 sm:flex sm:flex-wrap"
        >
          {(['simpler', 'example'] as const).map((kind) => (
            <button
              key={kind}
              className="focus-visible:outline-ring border-border bg-background text-foreground hover:bg-muted inline-flex min-h-11 min-w-0 items-center justify-center rounded-full border px-2.5 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:px-4 sm:text-sm"
              disabled={busy || (resolved && !messages.some((message) => message.kind === kind))}
              onClick={() => onRequest(kind)}
            >
              {kind === 'simpler' ? 'Más simple' : 'Dame un ejemplo'}
            </button>
          ))}
          {turns.some((turn) => turn.kind === 'why_wrong') && (
            <button
              className="text-muted-foreground hover:text-foreground focus-visible:outline-ring col-span-2 inline-flex min-h-11 w-fit items-center px-1 text-xs underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              disabled={busy}
              onClick={() => onRequest('why_wrong')}
            >
              Ver explicación inicial
            </button>
          )}
        </div>
      )}
    </div>
  );
}
