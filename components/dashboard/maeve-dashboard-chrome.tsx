'use client';

import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MaeveStudyHero } from '@/components/dashboard/maeve-study-hero';
import { StudyFirstVisitNudge } from '@/components/dashboard/study-first-visit-nudge';

type Props = {
  children: ReactNode;
  materialsCount: number;
  sharedMaterialsCount: number;
  initialCarreraId?: string;
};

/**
 * Study-first dashboard chrome. Upload triggers are delegated to PdfFirstUploadShell
 * through the shared ?openUpload=1 entry point.
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
      <StudyFirstVisitNudge materialsCount={materialsCount} onUploadClick={openUpload} />
      <div className="[&_button]:shadow-none">{children}</div>
    </div>
  );
}
