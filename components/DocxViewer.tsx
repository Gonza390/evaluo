'use client';

import { Download, FileText } from 'lucide-react';

export function DocxViewer({
  title, text, url, hasImages = false, className = '',
}: {
  title: string; text: string; url: string; hasImages?: boolean; className?: string;
}) {
  const blocks = text.split(/\n\s*\n/g).map((part) => part.trim()).filter(Boolean);
  return (
    <div className={'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card ' + className}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="truncate text-sm font-medium">{title}</span>
        </div>
        <a href={url} download className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-muted">
          <Download className="size-3.5" aria-hidden="true" /> Descargar Word
        </a>
      </header>
      {hasImages && (
        <p role="note" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          El documento contiene imágenes. Esta primera versión muestra su texto; las imágenes no se interpretan.
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        <article className="mx-auto max-w-[690px] space-y-4 text-sm leading-7 text-foreground">
          {blocks.length ? blocks.map((block, index) => {
            const isTitle = block.length < 145 && (
              index === 0 || (index > 0 && blocks[index - 1]!.length > 160)
            );
            return isTitle
              ? <h3 key={index} className="text-[15px] font-semibold leading-6">{block}</h3>
              : <p key={index} className="whitespace-pre-wrap break-words">{block}</p>;
          }) : (
            <p className="text-muted-foreground">No pudimos recuperar la lectura original del Word. Podés descargar el archivo para consultarlo.</p>
          )}
        </article>
      </div>
    </div>
  );
}