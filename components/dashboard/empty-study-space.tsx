'use client';

import Image from 'next/image';
import styles from './empty-study-space.module.css';
import { useState, type DragEvent } from 'react';
import { AudioLines, BookOpen, Upload } from 'lucide-react';
import { usePdfDropUpload, usePdfUploadTrigger } from '@/components/dashboard/pdf-first-upload-shell';

type Format = { title: string; label: string; color: string; icon?: 'book' | 'audio' };
const illustratedFormats: Format[] = [
  { title: 'PDF', label: 'PDF', color: 'bg-[#d92d3a]' },
  { title: 'PPTX', label: 'Presentaciones', color: 'bg-[#c2570c]' },
  { title: 'DOCX', label: 'Documentos', color: 'bg-[#1d5fd1]' },
  { title: 'Libros', label: 'Libros', color: 'bg-[#6a40c9]', icon: 'book' },
  { title: 'Grabaciones', label: 'Grabaciones', color: 'bg-[#08976b]', icon: 'audio' },
];

/**
 * First-material screen. The format pictograms reproduce the supplied visual
 * reference; they are illustrations, not a statement of accepted upload types.
 * The existing uploader validates PDF files and owns the processing lifecycle.
 */
export function EmptyStudySpace({ firstName }: { firstName?: string }) {
  const openUploadPicker = usePdfUploadTrigger();
  const dropUpload = usePdfDropUpload();
  const [isDragging, setIsDragging] = useState(false);

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
      aria-label="Empezá a estudiar con Evaluo"
      className="mx-auto flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden rounded-[22px] border border-[#e3eaf5] px-3 py-3 text-center shadow-[0_8px_30px_rgba(20,60,140,0.06)] sm:rounded-[28px] sm:px-6 sm:py-4"
      style={{ background: 'linear-gradient(180deg, #eef4ff 0%, #ffffff 85%)' }}
    >
      <Image
        src="/evi-bienvenida.svg"
        alt="Evi te da la bienvenida con una hoja para estudiar"
        width={112}
        height={112}
        priority
        className="h-[72px] w-[72px] shrink-0 object-contain sm:h-[92px] sm:w-[92px] lg:h-[106px] lg:w-[106px]"
      />
      <h1 className="mt-2 max-w-[800px] text-[24px] font-semibold leading-[1.14] tracking-[-0.035em] text-[#0f1623] sm:text-[30px] lg:text-[32px]">
        ¿Qué estudiamos hoy{firstName ? `, ${firstName}` : ''}?
      </h1>
      <p className="mt-1.5 max-w-[560px] text-[12px] leading-[1.45] text-[#526079] sm:text-[13px]">
        Subí tu primer material y Evaluo lo convierte en resumen, práctica y plan de estudio.
      </p>

      <button
        type="button"
        onClick={openPicker}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setIsDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        aria-label="Arrastrá un archivo PDF o presioná para elegirlo"
        className={`mt-3 flex w-full max-w-[620px] cursor-pointer flex-col items-center rounded-[18px] border-2 border-dashed px-2 py-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:mt-4 sm:rounded-[22px] sm:px-5 sm:py-4 ${isDragging ? 'border-[#2563eb] bg-[#e6efff]' : 'border-[#b4c9ee] bg-[#f7faff] hover:border-[#6394f0] hover:bg-[#f0f6ff]'}`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#dbe6f8] bg-white text-[#0b63e5] sm:size-10">
          <Upload className="size-[19px]" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="mt-2 text-[15px] font-medium tracking-[-0.02em] text-[#0f1623] sm:text-[17px]">Arrastrá tu PDF acá</span>
        <span className="mt-1 text-[12px] text-[#526079]">
          <span className="sm:hidden">o tocá acá para elegirlo</span>
          <span className="hidden sm:inline">o hacé clic para elegirlo</span>
        </span>
        <span className="mt-3 flex w-full flex-wrap items-start justify-center gap-x-3 gap-y-1.5 sm:mt-4 sm:gap-x-5">
          {illustratedFormats.map((format, index) => (
            <span key={format.title} className="flex min-w-[42px] flex-col items-center gap-1" title={format.title === 'PDF' ? 'PDF disponible' : 'Otros formatos: próximamente'}>
              <span className={`${styles.fileFormatIcon} flex h-[31px] w-[29px] items-center justify-center rounded-[6px] text-white sm:h-9 sm:w-8 ${format.color}`} style={{ animationDelay: `${index * 140}ms` }}>
                {format.icon === 'book' ? <BookOpen className="size-[18px]" aria-hidden="true" />
                  : format.icon === 'audio' ? <AudioLines className="size-[18px]" aria-hidden="true" />
                    : <span className="text-[9px] font-bold">{format.title}</span>}
              </span>
              <span className="text-[9px] text-[#667085] sm:text-[10px]">{format.label}</span>
            </span>
          ))}
        </span>
        <span className="sr-only">Actualmente solo se pueden cargar archivos PDF. Los demás formatos ilustrados todavía no están disponibles.</span>
      </button>
    </section>
  );
}
