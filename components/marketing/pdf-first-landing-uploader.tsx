'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { savePdfFirstDraft } from '@/lib/pdf-first-draft';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES } from '@/lib/student-materials/validation';

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(mb >= 10 ? 0 : 1).replace('.', ',')} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

function normalizeSource(value: string | null) {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return normalized ? `pdf-first-landing-${normalized}` : 'pdf-first-landing';
}

export function PdfFirstLandingUploader() {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState('pdf-first-landing');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resolvedSource = normalizeSource(params.get('source') ?? params.get('utm_source'));
    setSource(resolvedSource);

    trackMarketingEvent('pdf_first_landing_viewed', {
      location: 'estudiar_pdf_con_ia',
      source: resolvedSource,
    });
  }, []);

  const chooseFile = () => {
    trackMarketingEvent('pdf_picker_opened', {
      location: 'estudiar_pdf_con_ia',
      source,
    });
    pickerRef.current?.click();
  };

  const selectFile = (selected: File | null) => {
    if (!selected) return;

    const isPdf =
      selected.name.toLowerCase().endsWith('.pdf') &&
      (!selected.type || selected.type === 'application/pdf');

    if (!isPdf) {
      setFile(null);
      setError('Por ahora solo aceptamos archivos PDF.');
      return;
    }

    if (selected.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      setFile(null);
      setError('El PDF supera el tamaño máximo permitido de 20 MB.');
      return;
    }

    setError('');
    setFile(selected);
    trackMarketingEvent('pdf_selected', {
      location: 'estudiar_pdf_con_ia',
      source,
      file_size_bytes: selected.size,
    });
  };

  const continueWithFile = async () => {
    if (!file || saving) return;

    setSaving(true);
    setError('');

    try {
      await savePdfFirstDraft(file, source);

      trackMarketingEvent('create_material_clicked', {
        location: 'estudiar_pdf_con_ia',
        source,
        file_size_bytes: file.size,
      });

      const nextPath = `/dashboard?openUpload=1&source=${encodeURIComponent(source)}`;
      const login = new URL('/login', window.location.origin);
      login.searchParams.set('mode', 'signup');
      login.searchParams.set('reason', 'pdf-first');
      login.searchParams.set('next', nextPath);
      window.location.href = `${login.pathname}${login.search}`;
    } catch {
      setError('No pudimos conservar el PDF para continuar. Probá nuevamente.');
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[40px] bg-indigo-100/50 blur-3xl" aria-hidden="true" />
      <div className="relative rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_30px_70px_rgba(15,23,42,0.11)] sm:p-6">
        <div className="flex items-center justify-between gap-3 px-1 pb-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">Empezá con tu archivo</p>
            <p className="mt-1 text-sm font-bold text-slate-950">Primero elegís el PDF. Después creás tu cuenta.</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Todavía no se sube
          </span>
        </div>

        <input
          ref={pickerRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(event) => {
            selectFile(event.currentTarget.files?.[0] ?? null);
            event.currentTarget.value = '';
          }}
        />

        {!file ? (
          <button
            type="button"
            onClick={chooseFile}
            className="group flex min-h-[235px] w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-slate-300 bg-slate-50/80 px-6 text-center transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <span className="from-brand to-brand-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-4 text-base font-bold text-slate-950">Elegí el PDF que vas a estudiar</span>
            <span className="mt-1.5 text-xs leading-5 text-slate-500">Tocá para buscar el archivo · PDF · máximo 20 MB</span>
          </button>
        ) : (
          <div>
            <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatBytes(file.size)} · listo para continuar</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError('');
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label="Quitar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void continueWithFile()}
              disabled={saving}
              className="from-brand to-brand-2 mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />}
              {saving ? 'Guardando tu selección…' : 'Crear material de estudio'}
            </button>

            <button
              type="button"
              onClick={chooseFile}
              disabled={saving}
              className="mt-3 w-full text-center text-xs font-semibold text-slate-500 transition hover:text-indigo-700 disabled:opacity-50"
            >
              Cambiar archivo
            </button>
          </div>
        )}

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500 sm:grid-cols-2">
          <span className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
            No necesitás registrarte para elegir el archivo.
          </span>
          <span className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
            Tu cuenta se pide recién al crear el material.
          </span>
        </div>
      </div>
    </div>
  );
}
