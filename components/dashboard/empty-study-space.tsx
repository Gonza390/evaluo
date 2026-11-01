'use client';

import Image from 'next/image';
import { useState, type DragEvent } from 'react';
import { AudioLines, BookOpen, FileText, Upload } from 'lucide-react';
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
      aria-label="Empezá a estudiar con Evaluo"
      className="mx-auto flex w-full flex-col items-center rounded-[24px] border border-[#e3eaf5] px-4 py-7 text-center shadow-[0_8px_30px_rgba(20,60,140,0.06)] sm:rounded-[32px] sm:px-8 sm:py-9"
      style={{ background: 'linear-gradient(180deg, #eef4ff 0%, #ffffff 85%)' }}
    >
      <Image
        src="/evi-bienvenida.svg"
        alt="Evi te da la bienvenida con una hoja para estudiar"
        width={168}
        height={168}
        priority
        className="h-[112px] w-[112px] object-contain sm:h-[148px] sm:w-[148px]"
      />
      <h1 className="mt-3 max-w-[800px] text-[27px] font-bold leading-[1.15] tracking-[-0.035em] text-[#0f1623] sm:text-[35px] lg:text-[40px]">
        ¿Qué estudiamos hoy{firstName ? `, ${firstName}` : ''}?
      </h1>
      <p className="mt-3 max-w-[560px] text-[13px] leading-[1.55] text-[#526079] sm:text-[16px]">
        Subí tu primer material y Evaluo lo convierte en resumen, práctica y plan de estudio.
      </p>

      <button
        type="button"
        onClick={openPicker}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setIsDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        aria-label="Arrastrá un PDF acá o elegilo desde tu computadora"
        className={`mt-6 flex w-full max-w-[660px] cursor-pointer flex-col items-center rounded-[22px] border-2 border-dashed px-3 py-7 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:mt-7 sm:rounded-[24px] sm:px-6 sm:py-8 ${isDragging ? 'border-[#2563eb] bg-[#e6efff]' : 'border-[#b4c9ee] bg-[#f7faff] hover:border-[#6394f0] hover:bg-[#f0f6ff]'}`}
      >
        <span className="flex size-12 items-center justify-center rounded-full border border-[#dbe6f8] bg-white text-[#0b63e5] sm:size-14">
          <Upload className="size-6" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-[#0f1623] sm:text-[20px]">Arrastrá tu material acá</span>
        <span className="mt-1 text-[12px] text-[#526079] sm:text-[14px]">o elegilo desde tu computadora</span>
        <span className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#0b63e5] px-6 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,0.22)] sm:mt-5 sm:min-h-[52px] sm:text-[16px]">
          <Upload className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          Subir PDF
        </span>
        <span className="mt-6 flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-3 sm:gap-x-6">
          {illustratedFormats.map((format) => (
            <span key={format.title} className="flex min-w-[44px] flex-col items-center gap-1.5" title={format.title === 'PDF' ? 'PDF disponible' : 'Otros formatos: próximamente'}>
              <span className={`flex h-10 w-[34px] items-center justify-center rounded-[7px] text-white ${format.color}`}>
                {format.icon === 'book' ? <BookOpen className="size-[18px]" aria-hidden="true" />
                  : format.icon === 'audio' ? <AudioLines className="size-[18px]" aria-hidden="true" />
                    : <span className="text-[9px] font-bold">{format.title}</span>}
              </span>
              <span className="text-[10px] text-[#667085] sm:text-[12px]">{format.label}</span>
            </span>
          ))}
        </span>
        <span className="sr-only">Actualmente solo se pueden cargar archivos PDF. Los demás formatos ilustrados todavía no están disponibles.</span>
      </button>
    </section>
  );
}
