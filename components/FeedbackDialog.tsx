'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const feedbackCategories = [
  { value: 'problema', label: 'Problema' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'contenido', label: 'Contenido' },
  { value: 'otro', label: 'Otro' },
] as const;

type FeedbackCategory = (typeof feedbackCategories)[number]['value'];

function getOrCreateSessionKey() {
  const existing = window.localStorage.getItem('evaluo_session_key');
  if (existing) return existing;

  const created = `evaluo_${crypto.randomUUID()}`;
  window.localStorage.setItem('evaluo_session_key', created);
  return created;
}

type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePath: string;
};

export function FeedbackDialog({ open, onOpenChange, sourcePath }: FeedbackDialogProps) {
  const english = useOptionalAppLocale() === 'en';
  const [category, setCategory] = useState<FeedbackCategory>('sugerencia');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setError('');
    }
  }, [open]);

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
          phone: phone.trim(),
          source_path: sourcePath,
          session_key: getOrCreateSessionKey(),
        }),
      });

      if (!response.ok) {
        throw new Error('feedback_request_failed');
      }

      setCategory('sugerencia');
      setMessage('');
      setPhone('');
      onOpenChange(false);
    } catch {
      setError(english ? 'We could not send your feedback. Please try again.' : 'No pudimos enviar tu comentario. Probá de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-2xl border-slate-200 p-0 sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pb-4 pt-6 pr-12">
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
              {english ? 'Send feedback' : 'Enviar comentarios'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6">
            <div>
              <label htmlFor="feedback-category" className="text-sm font-semibold text-slate-900">
                {english ? 'Category' : 'Categoría'}
              </label>
              <select
                id="feedback-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/70"
              >
                {feedbackCategories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {english ? ({ problema: 'Problem', sugerencia: 'Suggestion', contenido: 'Content', otro: 'Other' } as Record<FeedbackCategory, string>)[item.value] : item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="feedback-message" className="text-sm font-semibold text-slate-900">
                {english ? 'Your feedback' : 'Tus comentarios'}
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, 1200))}
                rows={6}
                autoFocus
                placeholder={english ? "Tell us what you think..." : "Contanos qué pensás..."}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/70"
              />
            </div>

            <div>
              <label htmlFor="feedback-phone" className="text-sm font-semibold text-slate-900">
                {english ? 'Phone number' : 'Número de teléfono'} <span className="font-normal text-slate-500">{english ? '(optional)' : '(opcional)'}</span>
              </label>
              <input
                id="feedback-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.slice(0, 40))}
                placeholder={english ? "e.g., +1 415 555 0123" : "Ej. +54 9 11 1234 5678"}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/70"
              />
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                {english ? 'Leave your number if you would like us to contact you sooner.' : 'Dejá tu número si querés que podamos responderte más rápido.'}
              </p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <DialogFooter className="grid grid-cols-2 gap-3 px-6 pb-6 pt-5 sm:grid-cols-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl border-slate-200 font-semibold"
            >
              {english ? 'Cancel' : 'Cancelar'}
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="from-brand to-brand-2 h-11 rounded-xl bg-gradient-to-r font-semibold text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? (english ? 'Sending...' : 'Enviando...') : (english ? 'Send feedback' : 'Enviar comentarios')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
