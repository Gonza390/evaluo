import { Footer } from '@/components/footer';
import { PublicHeaderActions } from '@/components/public-header-actions';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader variant="landing" actions={<PublicHeaderActions />} />
        </div>
      </div>

      <main className="flex-1 bg-white">{children}</main>
      <Footer />
    </div>
  );
}
