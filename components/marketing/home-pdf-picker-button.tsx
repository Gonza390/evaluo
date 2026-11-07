'use client';

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { savePdfFirstDraft } from '@/lib/pdf-first-draft';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES, isSupportedStudentMaterialFile } from '@/lib/student-materials/file-rules';

type HomePdfPickerButtonProps = {
  className: string;
  location: string;
  ctaName: string;
  children: ReactNode;
  locale?: 'es' | 'en';
};

export function HomePdfPickerButton({
  className,
  location,
  ctaName,
  children,
  locale = 'es',
}: HomePdfPickerButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);

  const source = `home-pdf-first-${location}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  const chooseFile = () => {
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

  const continueWithFile = async (file: File | null) => {
    if (!file || saving) return;

    if (!isSupportedStudentMaterialFile(file.name, file.type)) {
      window.alert(locale === 'en' ? 'Please select a PDF or Word (.docx) file.' : 'Aceptamos archivos PDF y Word (.docx).');
      return;
    }

    if (file.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      window.alert(locale === 'en' ? 'This file exceeds the 20 MB limit.' : 'El archivo supera el tamaño máximo permitido de 20 MB.');
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
      const login = new URL(locale === 'en' ? '/en/login' : '/login', window.location.origin);
      login.searchParams.set('mode', 'signup');
      login.searchParams.set('reason', 'pdf-first');
      login.searchParams.set('next', nextPath);
      window.location.href = `${login.pathname}${login.search}`;
    } catch {
      setSaving(false);
      window.alert(locale === 'en' ? 'We could not save your file for the next step. Please try again.' : 'No pudimos conservar el archivo para continuar. Probá nuevamente.');
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0] ?? null;
          event.currentTarget.value = '';
          void continueWithFile(file);
        }}
      />
      <button type="button" onClick={chooseFile} disabled={saving} className={className}>
        {children}
      </button>
    </>
  );
}
