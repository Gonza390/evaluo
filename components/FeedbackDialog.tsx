'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [message, setMessage] = useState('');
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
          category: 'otro',
          message: message.trim(),
          source_path: sourcePath,
          session_key: getOrCreateSessionKey(),
        }),
      });

      if (!response.ok) {
        throw new Error('feedback_request_failed');
      }

      setMessage('');
      onOpenChange(false);
    } catch {
      setError('No pudimos enviar tu comentario. Probá de nuevo.');
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
              Enviar comentarios
            </DialogTitle>
          </DialogHeader>

          <div className="px-6">
            <label htmlFor="feedback-message" className="text-sm font-semibold text-slate-900">
              Tus comentarios
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 1200))}
              rows={7}
              autoFocus
              placeholder="Contanos qué pensás..."
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/70"
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>

          <DialogFooter className="grid grid-cols-2 gap-3 px-6 pb-6 pt-5 sm:grid-cols-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl border-slate-200 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="from-brand to-brand-2 h-11 rounded-xl bg-gradient-to-r font-semibold text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Enviando...' : 'Enviar comentarios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
