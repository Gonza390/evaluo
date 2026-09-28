'use client';

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { savePdfFirstDraft } from '@/lib/pdf-first-draft';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES } from '@/lib/student-materials/validation';

type HomePdfPickerButtonProps = {
  className: string;
  location: string;
  ctaName: string;
  children: ReactNode;
};

export function HomePdfPickerButton({
  className,
  location,
  ctaName,
  children,
}: HomePdfPickerButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);

  const source = `home-pdf-first-${location}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  const choosePdf = () => {
    if (saving) return;

    trackMarketingEvent('cta_click', {
      location,
      cta_name: ctaName,
      destination: 'pdf_picker',
    });
    trackMarketingEvent('pdf_picker_opened', {
      location,
      source,
    });

    inputRef.current?.click();
  };

  const continueWithPdf = async (file: File | null) => {
    if (!file || saving) return;

    const isPdf =
      file.name.toLowerCase().endsWith('.pdf') &&
      (!file.type || file.type === 'application/pdf');

    if (!isPdf) {
      window.alert('Por ahora solo aceptamos archivos PDF.');
      return;
    }

    if (file.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      window.alert('El PDF supera el tamaño máximo permitido de 20 MB.');
      return;
    }

    setSaving(true);

    try {
      trackMarketingEvent('pdf_selected', {
        location,
        source,
        file_size_bytes: file.size,
      });

      await savePdfFirstDraft(file, source);

      const nextPath = `/dashboard?openUpload=1&source=${encodeURIComponent(source)}`;
      const login = new URL('/login', window.location.origin);
      login.searchParams.set('mode', 'signup');
      login.searchParams.set('reason', 'pdf-first');
      login.searchParams.set('next', nextPath);
      window.location.href = `${login.pathname}${login.search}`;
    } catch {
      setSaving(false);
      window.alert('No pudimos conservar el PDF para continuar. Probá nuevamente.');
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0] ?? null;
          event.currentTarget.value = '';
          void continueWithPdf(file);
        }}
      />
      <button type="button" onClick={choosePdf} disabled={saving} className={className}>
        {children}
      </button>
    </>
  );
}
