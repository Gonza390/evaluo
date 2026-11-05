import { FileText } from 'lucide-react';

interface PdfCardThumbnailProps {
  resourcePath: string | null;
  title?: string;
  shouldLoad?: boolean;
  variant?: 'thumbnail' | 'preview';
}

/**
 * La tarjeta solo muestra un identificador estatico del documento.
 * No solicita miniaturas a Storage ni al endpoint /api/pdf-thumbnail.
 * Se mantienen los tamaños de las tarjetas existentes en Explorar.
 */
export function PdfCardThumbnail({
  resourcePath,
  title,
  variant = 'thumbnail',
}: PdfCardThumbnailProps) {
  const isWord = /\.docx(?:$|[?#])/i.test(resourcePath ?? '');
  const documentLabel = isWord ? 'Documento Word' : 'Documento PDF';

  if (variant === 'preview') {
    return (
      <div className="flex h-full w-full items-start justify-center">
        <div className="w-full max-w-[164px] overflow-hidden rounded-[7px] border border-slate-200 bg-white shadow-[0_9px_20px_rgba(15,23,42,0.10)]" aria-label={title ?? documentLabel}>
          <div className="flex aspect-[0.727] w-full items-center justify-center bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)] px-4 text-center">
            <div className="space-y-2.5">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2563EB]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
                {documentLabel}
              </p>
              <p className="text-[10px] leading-4 text-slate-400">Abrí el material para verlo completo</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] bg-white p-1.5 shadow-[0_10px_24px_rgba(37,99,235,0.08)]">
      <div className="overflow-hidden rounded-[12px] bg-white">
        <div className="flex h-[132px] w-[96px] items-center justify-center bg-[linear-gradient(180deg,#F8FAFF_0%,#EEF4FF_100%)] px-3 text-center" aria-label={title ?? documentLabel}>
          <div className="space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-[0_8px_20px_rgba(37,99,235,0.10)]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
              {isWord ? 'Word' : 'Material'}
            </p>
            <p className="text-[12px] leading-4 text-slate-500">Abrir documento</p>
          </div>
        </div>
      </div>
    </div>
  );
}
