'use client';

import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MaeveStudyHero } from '@/components/dashboard/maeve-study-hero';

type Props = {
  children: ReactNode;
  materialsCount: number;
  sharedMaterialsCount: number;
  initialCarreraId?: string;
};

/**
 * Ship E chrome: calm Maeve hero on top; hide the legacy dual-card catalog-first hero
 * inside StudentMaterialsWorkspace. Primary CTA opens PdfFirstUploadShell via label
 * capture (sr-only "Subir PDF") and also sets ?openUpload=1 as fallback.
 */
export function MaeveDashboardChrome({
  children,
  materialsCount,
  sharedMaterialsCount,
  initialCarreraId = '',
}: Props) {
  const heroRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const openUpload = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('openUpload') === '1') {
      url.searchParams.delete('openUpload');
      router.replace(`${url.pathname}${url.search}` || url.pathname);
      window.setTimeout(() => {
        const next = new URL(window.location.href);
        next.searchParams.set('openUpload', '1');
        router.replace(`${next.pathname}?${next.searchParams.toString()}`);
      }, 0);
      return;
    }
    url.searchParams.set('openUpload', '1');
    router.replace(`${url.pathname}?${url.searchParams.toString()}`);
  };

  return (
    <div className="min-w-0 space-y-4 overflow-x-clip">
      <MaeveStudyHero
        heroRef={heroRef as RefObject<HTMLElement | null>}
        materialsCount={materialsCount}
        sharedMaterialsCount={sharedMaterialsCount}
        initialCarreraId={initialCarreraId}
        onUploadClick={openUpload}
      />
      <div
        className={[
          // Hide legacy upload hero (first section) — catalog-centered dual cards.
          '[&>div>section:first-of-type]:hidden',
          '[&_button]:shadow-none',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
