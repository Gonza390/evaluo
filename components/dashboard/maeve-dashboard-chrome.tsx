'use client';

import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import { usePdfUploadTrigger } from '@/components/dashboard/pdf-first-upload-shell';
import { MaeveStudyHero } from '@/components/dashboard/maeve-study-hero';
import type { DashboardNextStudyAction } from '@/lib/dashboard-next-study-action';

type Props = {
  children: ReactNode;
  materialsCount: number;
  primaryMaterialHref: string | null;
  primaryMaterialReady: boolean;
  pendingReinforcementCount: number;
  nextStudyAction: DashboardNextStudyAction | null;
};

/**
 * Study-first dashboard chrome. The hero calls the explicit upload command
 * owned by PdfFirstUploadShell; deep links still use ?openUpload=1.
 */
export function MaeveDashboardChrome({
  children,
  materialsCount,
  primaryMaterialHref,
  primaryMaterialReady,
  pendingReinforcementCount,
  nextStudyAction,
}: Props) {
  const heroRef = useRef<HTMLElement | null>(null);
  const openUploadPicker = usePdfUploadTrigger();
  const openUpload = () => openUploadPicker(materialsCount === 0 ? 'dashboard_empty' : 'dashboard_hero');

  return (
    <div className="min-w-0 space-y-3 overflow-x-clip">
      <MaeveStudyHero
        heroRef={heroRef as RefObject<HTMLElement | null>}
        materialsCount={materialsCount}
        primaryMaterialHref={primaryMaterialHref}
        primaryMaterialReady={primaryMaterialReady}
        pendingReinforcementCount={pendingReinforcementCount}
        nextStudyAction={nextStudyAction}
        onUploadClick={openUpload}
      />
      {materialsCount > 0 ? <div className="[&_button]:shadow-none">{children}</div> : null}
    </div>
  );
}
