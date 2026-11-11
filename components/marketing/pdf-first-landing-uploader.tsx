'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildSoftwareApplicationJsonLd } from '@/lib/seo';
import { savePdfFirstDraft } from '@/lib/pdf-first-draft';
import {
  MAX_FREE_STUDENT_MATERIAL_PDF_PAGES,
  MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
  isSupportedStudentMaterialFile,
} from '@/lib/student-materials/file-rules';
import { countPdfPagesInBrowser, exceedsFreePdfPageLimit } from '@/lib/student-materials/pdf-page-count-client';
import { trackUploadFailure } from '@/lib/student-materials/upload-failure';
import { isUuid } from '@/lib/uuid';

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

const COPY = {
  ar: {
    kicker: 'Empezá con tu archivo',
    lead: 'Primero elegís tu material. Después creás tu cuenta.',
    notUploaded: 'Todavía no se sube',
    choose: 'Elegí tu material de estudio',
    chooseHint: 'Tocá para seleccionar tu material · máximo 20 MB',
    ready: 'listo para continuar',
    remove: 'Quitar archivo',
    saving: 'Guardando tu selección…',
    create: 'Crear material de estudio',
    change: 'Cambiar archivo',
    noSignup: 'No necesitás registrarte para elegir el archivo.',
    account: 'Tu cuenta se pide recién al crear el material.',
    unsupported: 'Este tipo de material no es compatible.',
    tooLarge: 'El material supera el tamaño máximo permitido de 20 MB.',
    saveError: 'No pudimos conservar el material para continuar. Probá nuevamente.',
    pageLimit: (pages: number, max: number) =>
      `Tu PDF tiene ${pages} páginas y en el plan gratis se pueden subir hasta ${max}. Elegí un archivo solo con los capítulos de tu examen.`,
  },
  neutral: {
    kicker: 'Empieza con tu archivo',
    lead: 'Primero eliges tu material. Después creas tu cuenta.',
    notUploaded: 'Todavía no se sube',
    choose: 'Elige tu material de estudio',
    chooseHint: 'Selecciona tu material · máximo 20 MB',
    ready: 'listo para continuar',
    remove: 'Quitar archivo',
    saving: 'Guardando tu selección…',
    create: 'Crear material de estudio',
    change: 'Cambiar archivo',
    noSignup: 'No necesitas registrarte para elegir el archivo.',
    account: 'La cuenta se solicita al crear el material.',
    unsupported: 'Este tipo de material no es compatible.',
    tooLarge: 'El material supera el tamaño máximo permitido de 20 MB.',
    saveError: 'No pudimos guardar el material. Inténtalo de nuevo.',
    pageLimit: (pages: number, max: number) =>
      `Tu PDF tiene ${pages} páginas y en el plan gratis se pueden subir hasta ${max}. Elige un archivo solo con los capítulos de tu examen.`,
  },
  en: {
    kicker: 'Start with your file',
    lead: 'Pick your material first. Create your account after.',
    notUploaded: 'Not uploaded yet',
    choose: 'Choose your study material',
    chooseHint: 'Up to 20 MB',
    ready: 'ready to continue',
    remove: 'Remove file',
    saving: 'Saving your selection…',
    create: 'Create study material',
    change: 'Change file',
    noSignup: 'No sign-up needed to choose your file.',
    account: 'You create an account when you generate the material.',
    unsupported: 'This file type is not supported. Use a PDF or Word file.',
    tooLarge: 'The file is larger than the 20 MB limit.',
    saveError: 'We could not save your file. Please try again.',
    pageLimit: (pages: number, max: number) =>
      `Your PDF has ${pages} pages and the free plan accepts up to ${max}. Choose a file with just the chapters for your exam.`,
  },
} as const;

export function PdfFirstLandingUploader({
  trackingLocation = 'estudiar_pdf_con_ia',
  sourceKey,
  locale,
  market,
}: {
  trackingLocation?: string;
  sourceKey?: string;
  locale?: 'neutral' | 'en';
  market?: string;
} = {}) {
  const t = COPY[locale ?? 'ar'];
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState('pdf-first-landing');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resolvedSource = normalizeSource(params.get('source') ?? sourceKey ?? params.get('utm_source'));
    setSource(resolvedSource);

    trackMarketingEvent('pdf_first_landing_viewed', {
      location: trackingLocation,
      source: resolvedSource,
      market,
    });
  }, [trackingLocation, sourceKey, market]);

  const chooseFile = () => {
    trackMarketingEvent('pdf_picker_opened', {
      location: trackingLocation,
      source,
      market,
    });
    pickerRef.current?.click();
  };

  const selectFile = (selected: File | null) => {
    if (!selected) return;

    if (!isSupportedStudentMaterialFile(selected.name, selected.type)) {
      setFile(null);
      setError(t.unsupported);
      return;
    }

    if (selected.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      trackUploadFailure({
        stage: 'too_large',
        source,
        flow: 'landing',
        location: trackingLocation,
        fileSizeBytes: selected.size,
      });
      setFile(null);
      setError(t.tooLarge);
      return;
    }

    setError('');
    setFile(selected);
    trackMarketingEvent('pdf_selected', {
      location: trackingLocation,
      source,
      file_size_bytes: selected.size,
      market,
    });
  };

  const continueWithFile = async () => {
    if (!file || saving) return;

    setSaving(true);
    setError('');

    // Antes de pedir el registro: si el PDF supera el límite de páginas del plan
    // gratis, avisar ahora y no después de crear la cuenta y subirlo entero.
    const pageCount = await countPdfPagesInBrowser(file);
    if (exceedsFreePdfPageLimit(pageCount, MAX_FREE_STUDENT_MATERIAL_PDF_PAGES)) {
      trackUploadFailure({
        stage: 'pre_signup_page_limit',
        source,
        flow: 'landing',
        location: trackingLocation,
        fileSizeBytes: file.size,
        pageCount,
        maxPages: MAX_FREE_STUDENT_MATERIAL_PDF_PAGES,
      });
      setError(t.pageLimit(pageCount!, MAX_FREE_STUDENT_MATERIAL_PDF_PAGES));
      setSaving(false);
      return;
    }

    try {
      await savePdfFirstDraft(file, source);

      trackMarketingEvent('create_material_clicked', {
        location: trackingLocation,
        source,
        file_size_bytes: file.size,
        market,
      });

      const nextParams = new URLSearchParams({ openUpload: '1', source });
      // Preserve the source subject after signing up; the dashboard validates the
      // subject and uses it for conversion attribution, not automatic selection.
      const requestedMateriaId = new URLSearchParams(window.location.search).get('materiaId');
      if (isUuid(requestedMateriaId)) nextParams.set('materiaId', requestedMateriaId!);
      const nextPath = `/dashboard?${nextParams.toString()}`;
      const login = new URL(locale === 'en' ? '/en/login' : '/login', window.location.origin);
      login.searchParams.set('mode', 'signup');
      login.searchParams.set('reason', 'pdf-first');
      login.searchParams.set('next', nextPath);
      window.location.href = `${login.pathname}${login.search}`;
    } catch {
      setError(t.saveError);
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Cada landing con selector de archivo es una página de producto: la describe como aplicación. */}
      <JsonLd data={buildSoftwareApplicationJsonLd(locale === 'en' ? 'en' : 'es')} />
      <div className="pointer-events-none absolute inset-x-0 -inset-y-6 rounded-[40px] bg-blue-100/50 blur-3xl" aria-hidden="true" />
      <div className="relative rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_30px_70px_rgba(15,23,42,0.11)] sm:p-6">
        <div className="flex items-center justify-between gap-3 px-1 pb-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-blue-700 uppercase">{t.kicker}</p>
            <p className="mt-1 text-sm font-bold text-slate-950">{t.lead}</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t.notUploaded}
          </span>
        </div>

        <input
          ref={pickerRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
            className="group flex min-h-[235px] w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-slate-300 bg-slate-50/80 px-6 text-center transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <span className="from-brand to-brand-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-4 text-base font-bold text-slate-950">{t.choose}</span>
            <span className="mt-1.5 text-xs leading-5 text-slate-500">{t.chooseHint}</span>
          </button>
        ) : (
          <div>
            <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatBytes(file.size)} · {t.ready}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError('');
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label={t.remove}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void continueWithFile()}
              disabled={saving}
              className="from-brand to-brand-2 mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />}
              {saving ? t.saving : t.create}
            </button>

            <button
              type="button"
              onClick={chooseFile}
              disabled={saving}
              className="mt-3 w-full text-center text-xs font-semibold text-slate-500 transition hover:text-blue-700 disabled:opacity-50"
            >
              {t.change}
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
            {t.noSignup}
          </span>
          <span className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
            {t.account}
          </span>
        </div>
      </div>
    </div>
  );
}
