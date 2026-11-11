'use client';

import Image from 'next/image';
import styles from './empty-study-space.module.css';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { Upload } from 'lucide-react';
import { usePdfDropUpload, usePdfUploadTrigger } from '@/components/dashboard/pdf-first-upload-shell';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { studentEntryText } from '@/lib/i18n/student-entry-copy';

/**
 * First-material screen. The uploader validates the file and owns the
 * processing lifecycle.
 */
export function EmptyStudySpace({ firstName }: { firstName?: string }) {
  const { locale } = useAppLocale();
  const t = (value: string) => studentEntryText(locale, value);
  const openUploadPicker = usePdfUploadTrigger();
  const dropUpload = usePdfDropUpload();
  const [isDragging, setIsDragging] = useState(false);
  const viewTrackedRef = useRef(false);

  // Esta pantalla reemplazó al hero anterior el 1/11 y el evento de vista quedó
  // solo en el hero: desde entonces no se registraba quién la veía.
  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackMarketingEvent('first_pdf_cta_viewed', { location: 'dashboard_empty' });
  }, []);

  const openPicker = () => openUploadPicker('dashboard_empty');
  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file) dropUpload(file);
  };

  return (
    <section
      data-empty-study-space
      aria-label={t("Empezá a estudiar con Evaluo")}
      className={`${styles.mobileLowered} mx-auto flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden px-6 py-8 text-center`}
    >
      <Image
        src="/evi-bienvenida.svg"
        alt={t("Evi te da la bienvenida con una hoja para estudiar")}
        width={112}
        height={112}
        priority
        className="h-24 w-24 shrink-0 object-contain lg:h-28 lg:w-28"
      />
      <h1 className="mt-4 max-w-[640px] text-titulo font-semibold leading-[1.18] tracking-titulo text-[#0f1623] lg:text-destacado">
        {locale === 'en' ? `What are we studying today${firstName ? `, ${firstName}` : ''}?` : `¿Qué estudiamos hoy${firstName ? `, ${firstName}` : ''}?`}
      </h1>
      <p className="mt-2.5 max-w-[420px] text-cuerpo leading-[1.45] text-[#4b5565]">
        {t("Subí el apunte de tu próximo examen y te armamos un plan de estudios.")}
      </p>

      <button
        type="button"
        data-first-pdf-cta
        onClick={openPicker}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setIsDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        className={`mt-8 flex min-h-[54px] w-full max-w-[360px] items-center justify-center gap-2.5 rounded-full px-6 text-cuerpo font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,.20)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${isDragging ? 'bg-[#2a5193] ring-4 ring-[#c9d8f3]' : 'bg-[#3c6cba] hover:bg-[#2a5193]'}`}
      >
        <Upload className="size-[19px]" strokeWidth={2} aria-hidden="true" />
        {isDragging ? t("Soltalo para subirlo") : t("Elegir mi PDF")}
      </button>
      <p className="mt-3 text-chico text-[#667085]">
        {t("PDF o Word (.docx) · hasta 20 MB")}
        <span className="hidden lg:inline"> · {t("también podés arrastrarlo")}</span>
      </p>
    </section>
  );
}
