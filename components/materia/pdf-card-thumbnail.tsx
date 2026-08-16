'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

interface PdfCardThumbnailProps {
  resourcePath: string | null;
  title?: string;
  shouldLoad?: boolean;
}

export function PdfCardThumbnail({
  resourcePath,
  title = 'Portada del PDF',
  shouldLoad: _shouldLoad = true,
}: PdfCardThumbnailProps) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const isPdf = Boolean(resourcePath && resourcePath.toLowerCase().endsWith('.pdf'));
  const thumbnailSrc = resourcePath
    ? `/api/pdf-thumbnail?path=${encodeURIComponent(resourcePath)}`
    : null;

  useEffect(() => {
    setThumbnailFailed(false);
  }, [resourcePath]);

  return (
    <div className="rounded-[18px] bg-white p-1.5 shadow-[0_10px_24px_rgba(37,99,235,0.08)]">
      <div className="overflow-hidden rounded-[12px] bg-white">
        {isPdf && thumbnailSrc && !thumbnailFailed ? (
          <div className="relative h-[132px] w-[96px] overflow-hidden bg-white">
            <Image
              src={thumbnailSrc}
              alt={title}
              fill
              sizes="96px"
              className="object-contain"
              loading="lazy"
              unoptimized
              onError={() => setThumbnailFailed(true)}
            />
          </div>
        ) : (
          <div className="flex h-[132px] w-[96px] items-center justify-center bg-[linear-gradient(180deg,#F8FAFF_0%,#EEF4FF_100%)] px-3 text-center">
            <div className="space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#4F5DFF] shadow-[0_8px_20px_rgba(37,99,235,0.10)]">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4F5DFF]">
                Material
              </p>
              <p className="text-[12px] leading-4 text-slate-500">
                Vista previa al abrir
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
