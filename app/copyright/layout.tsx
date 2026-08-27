import type { ReactNode } from 'react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';

export default function CopyrightLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader trackingLocation="copyright_header" />
        </div>
      </div>
      {children}
    </>
  );
}
