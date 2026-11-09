'use client';

import Image from 'next/image';
import styles from './empty-study-space.module.css';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { Upload } from 'lucide-react';
import { usePdfDropUpload, usePdfUploadTrigger } from '@/components/dashboard/pdf-first-upload-shell';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { studentEntryText } from '@/lib/i18n/student-entry-copy';

type Format = { title: string; label: string; color: string };
// Solo los formatos que hoy se pueden subir. Antes se mostraban también
// presentaciones, libros y grabaciones, que no se aceptan (onboarding etapa 1).
const acceptedFormats: Format[] = [
  { title: 'PDF', label: 'PDF', color: 'bg-[#bb5654]' },
  { title: 'DOCX', label: 'Word', color: 'bg-[#3865b3]' },
];

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
      className={`${styles.mobileLowered} mx-auto flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden rounded-[22px] border border-[#e3eaf5] px-3 py-3 text-center shadow-[0_8px_30px_rgba(20,60,140,0.06)] sm:rounded-[28px] sm:px-6 sm:py-4`}
      style={{ background: 'linear-gradient(180deg, #eef4ff 0%, #ffffff 85%)' }}
    >
      <Image
        src="/evi-bienvenida.svg"
        alt={t("Evi te da la bienvenida con una hoja para estudiar")}
        width={112}
        height={112}
        priority
        className="h-[72px] w-[72px] shrink-0 object-contain sm:h-[92px] sm:w-[92px] lg:h-[106px] lg:w-[106px]"
      />
      <h1 className="mt-2 max-w-[800px] text-titulo font-semibold leading-[1.14] tracking-titulo text-[#0f1623] sm:text-destacado lg:text-destacado">
        {locale === 'en' ? `What are we studying today${firstName ? `, ${firstName}` : ''}?` : `¿Qué estudiamos hoy${firstName ? `, ${firstName}` : ''}?`}
      </h1>
      <p className="mt-1.5 max-w-[560px] text-chico leading-[1.45] text-[#526079] sm:text-ui">
        {t("Subí tu primer material y Evaluo lo convierte en resumen, práctica y plan de estudio.")}
      </p>

      <button
        type="button"
        onClick={openPicker}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setIsDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        aria-label={t("Arrastrá tu material o presioná para elegirlo")}
        className={`mt-3 flex w-full max-w-[620px] cursor-pointer flex-col items-center rounded-[18px] border-2 border-dashed px-2 py-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:mt-4 sm:rounded-[22px] sm:px-5 sm:py-4 ${isDragging ? 'border-[#456dbd] bg-[#e6efff]' : 'border-[#b4c9ee] bg-[#f7faff] hover:border-[#6f96dd] hover:bg-[#f0f6ff]'}`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#dbe6f8] bg-white text-[#3c6cba] sm:size-10">
          <Upload className="size-[19px]" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="mt-2 text-cuerpo font-medium tracking-titulo text-[#0f1623] sm:text-subtitulo">{t("Arrastrá tu material acá")}</span>
        <span className="mt-1 text-chico text-[#526079]">
          <span className="sm:hidden">{t("o tocá acá para elegirlo")}</span>
          <span className="hidden sm:inline">{t("o hacé clic para elegirlo")}</span>
        </span>
        <span className="mt-3 flex w-full flex-wrap items-start justify-center gap-x-3 gap-y-1.5 sm:mt-4 sm:gap-x-5">
          {acceptedFormats.map((format, index) => (
            <span key={format.title} className="flex min-w-[42px] flex-col items-center gap-1" aria-hidden="true">
              <span className={`${styles.fileFormatIcon} flex h-[31px] w-[29px] items-center justify-center rounded-[6px] text-white sm:h-9 sm:w-8 ${format.color}`} style={{ animationDelay: `${index * 140}ms` }}>
                <span className="text-etiqueta font-semibold">{format.title}</span>
              </span>
              <span className="text-etiqueta text-[#667085] sm:text-etiqueta">{format.label}</span>
            </span>
          ))}
        </span>
        <span className="mt-2 text-etiqueta text-[#667085]">{t("Solo PDF y Word (.docx) · máximo 20 MB")}</span>
      </button>
    </section>
  );
}
