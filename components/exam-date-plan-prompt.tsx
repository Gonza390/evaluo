'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, Loader2, X } from 'lucide-react';
import {
  dismissExamDatePromptAction,
  getExamDatePromptEligibilityAction,
  saveStudentMaterialExamDateAction,
  trackExamDatePromptViewedAction,
} from '@/app/dashboard/materiales/exam-date-prompt-actions';

type Props = {
  materialId: string;
  fileName: string;
  triggerNonce?: number;
};

function argentinaTodayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function sessionKey(materialId: string) {
  return `evaluo:exam-date-prompt:closed:${materialId}`;
}

export function ExamDatePlanPrompt({ materialId, fileName, triggerNonce = 0 }: Props) {
  const [visible, setVisible] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasShownRef = useRef(false);

  const minDate = useMemo(() => addDays(argentinaTodayKey(), 1), []);

  const plan = useMemo(() => {
    if (!examDate) return [];

    const today = argentinaTodayKey();
    const milestones = [
      {
        offset: 7,
        label: '7 días antes',
        text: 'Comprobá qué recordás y volvé sobre los temas más importantes.',
      },
      {
        offset: 3,
        label: '3 días antes',
        text: 'Reforzá errores y conceptos que todavía te cuestan.',
      },
      {
        offset: 1,
        label: '1 día antes',
        text: 'Hacé un repaso corto y enfocado antes del examen.',
      },
    ];

    return [
      {
        label: 'Hoy',
        text: 'Seguí estudiando y detectá qué temas necesitás reforzar.',
      },
      ...milestones
        .map((item) => ({
          ...item,
          date: addDays(examDate, -item.offset),
        }))
        .filter((item) => item.date > today)
        .map(({ label, text }) => ({ label, text })),
    ];
  }, [examDate]);

  const canOpenInSession = useCallback(() => {
    try {
      return window.sessionStorage.getItem(sessionKey(materialId)) !== '1';
    } catch {
      return true;
    }
  }, [materialId]);

  const checkAndOpen = useCallback(
    async (forceCurrentSignal: boolean) => {
      if (hasShownRef.current || visible || saved || checking || !canOpenInSession()) return;

      setChecking(true);
      const result = await getExamDatePromptEligibilityAction({
        materialId,
        forceCurrentSignal,
      });
      setChecking(false);

      if (!result.success || !result.eligible) return;

      hasShownRef.current = true;
      await trackExamDatePromptViewedAction(materialId);
      setVisible(true);
    },
    [canOpenInSession, checking, materialId, saved, visible]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkAndOpen(false);
    }, 8_000);
    return () => window.clearTimeout(timer);
  }, [checkAndOpen]);

  useEffect(() => {
    if (triggerNonce <= 0) return;
    void checkAndOpen(true);
  }, [checkAndOpen, triggerNonce]);

  const close = () => {
    try {
      window.sessionStorage.setItem(sessionKey(materialId), '1');
    } catch {
      // El cierre sigue funcionando aunque sessionStorage esté bloqueado.
    }
    setVisible(false);
    void dismissExamDatePromptAction(materialId);
  };

  const save = async () => {
    if (!examDate || saving) return;

    setSaving(true);
    setError(null);
    const result = await saveStudentMaterialExamDateAction({
      materialId,
      examDate,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    try {
      window.sessionStorage.setItem(sessionKey(materialId), '1');
    } catch {
      // La fecha ya quedó persistida en servidor.
    }
    setSaved(true);
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-[#08132A]/55 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="fixed inset-0 z-[91] flex items-end justify-center sm:items-center sm:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="exam-date-prompt-title"
          className="relative w-full max-w-[520px] overflow-hidden rounded-t-[28px] border border-white/60 bg-white shadow-[0_30px_100px_rgba(2,12,35,0.35)] sm:rounded-[28px]"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>

          {!saved ? (
            <div className="p-6 pb-7 sm:p-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <CalendarDays className="h-5 w-5" />
              </div>

              <p className="pr-10 text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                Organizá tu repaso
              </p>

              <h2
                id="exam-date-prompt-title"
                className="mt-2 pr-8 text-[25px] font-bold leading-[1.14] tracking-[-0.035em] text-[#0F1B3D] sm:text-[29px]"
              >
                ¿Cuándo rendís “{fileName}”?
              </h2>

              <p className="mt-4 text-[15px] leading-6 text-slate-600">
                Cargá la fecha y Evaluo organiza tus repasos hasta el examen para ayudarte a llegar con los temas importantes reforzados.
              </p>

              <label
                className="mt-6 block text-xs font-bold text-slate-700"
                htmlFor={`exam-date-${materialId}`}
              >
                Fecha del examen
              </label>
              <div className="relative mt-2">
                <input
                  id={`exam-date-${materialId}`}
                  type="date"
                  value={examDate}
                  min={minDate}
                  onChange={(event) => setExamDate(event.target.value)}
                  className="h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 pr-12 text-[15px] font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                type="button"
                disabled={!examDate || saving}
                onClick={() => void save()}
                className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(37,99,235,0.22)] transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Guardando...' : 'Guardar fecha'}
              </button>

              {error ? (
                <p className="mt-3 text-center text-xs leading-5 text-rose-600">{error}</p>
              ) : null}

              <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
                Podés cambiarla más adelante desde tu material.
              </p>
            </div>
          ) : (
            <div className="p-6 pb-7 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>

              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                Plan de repaso
              </p>

              <h2
                id="exam-date-prompt-title"
                className="mt-2 pr-8 text-[25px] font-bold leading-[1.14] tracking-[-0.035em] text-[#0F1B3D] sm:text-[29px]"
              >
                Listo. Rendís el {formatDate(examDate)}.
              </h2>

              <p className="mt-3 text-[15px] leading-6 text-slate-600">
                Evaluo va a usar esta fecha para ayudarte a organizar el repaso de “{fileName}”.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#E7EBF4]">
                {plan.map((item, index) => (
                  <div
                    key={item.label}
                    className={`grid grid-cols-[88px_1fr] gap-3 px-4 py-3.5 ${index > 0 ? 'border-t border-[#E7EBF4]' : ''}`}
                  >
                    <div className="text-[11px] font-black text-indigo-600">{item.label}</div>
                    <div className="text-[12px] leading-5 text-slate-600">{item.text}</div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setVisible(false)}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-[#2563EB] px-5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
              >
                Entendido
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
