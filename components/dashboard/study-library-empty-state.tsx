'use client';

import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Ship G — calm empty library consistent with Ship E/F (no brand string). */
export function StudyLibraryEmptyState() {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-200/90 bg-slate-50/60 px-5 py-9 text-center">
      <FileText className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-semibold tracking-[-0.02em] text-slate-900">Tu biblioteca está vacía</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-slate-500">
        Subí tu PDF y en unos minutos ves resumen, glosario y ejercicios acá. Mientras lo preparamos
        aparece con el estado Procesando.
      </p>
      {/* Label "Subir PDF" is captured by PdfFirstUploadShell (Ship E/G). */}
      <Button type="button" className="mt-5 h-11 rounded-2xl px-5 text-[14px] font-semibold">
        Subí tu PDF
        <span className="sr-only"> Subir PDF</span>
        <Upload className="h-4 w-4" />
      </Button>
    </div>
  );
}
