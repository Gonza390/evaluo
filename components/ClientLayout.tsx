'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, GraduationCap, Crown, LogIn } from 'lucide-react';
import { Footer } from './footer';
import { Navbar } from './navbar';
import { UserProvider } from '@/hooks/useUser';
import { useUser } from '@/hooks/useUser';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { Toaster } from '@/components/ui/toaster';

function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const bottomNavItems = [
    { label: 'Inicio', href: '/dashboard', icon: Home },
    { label: 'Explorar', href: '/explorar', icon: Search },
    {
      label: 'Carreras',
      href: '/explorar?universidad=Universidad%20Siglo%2021',
      icon: GraduationCap,
    },
    user
      ? { label: 'Potencia', href: '/pricing', icon: Crown, variant: 'cta' as const }
      : { label: 'Ingresar', href: '/login', icon: LogIn, variant: 'cta' as const },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/90 bg-white/96 pb-safe backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 items-stretch gap-1 px-2 py-2.5">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={
                item.variant === 'cta'
                  ? 'mx-1 flex min-h-[54px] flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-[#4F5DFF] to-[#6D5EF8] px-2 py-2 text-white shadow-[0_8px_20px_rgba(79,93,255,0.30)]'
                  : `flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 ${
                      isActive ? 'text-[#4F5DFF]' : 'text-slate-500'
                    }`
              }
            >
              <Icon className={item.variant === 'cta' ? 'h-5 w-5' : 'h-5 w-5'} />
              <span className={`font-medium ${item.variant === 'cta' ? 'text-[10px]' : 'text-[10px]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';
  const isSimuladorRoute = pathname.startsWith('/simulador');
  const isLegalRoute =
    pathname === '/copyright' || pathname === '/terminos' || pathname === '/privacidad';
  const isPublicRoute = isHomePage || isLoginPage;
  const isAdministradorRoute = pathname.startsWith('/administrador');
  const showSidebar =
    !isAdministradorRoute &&
    !isPublicRoute &&
    !isSimuladorRoute &&
    !isLegalRoute;
  const showBottomNav =
    !isAdministradorRoute &&
    !isPublicRoute &&
    !isSimuladorRoute &&
    !isLegalRoute;
  const shell = (
    <div className="flex min-h-screen bg-white">
      {showSidebar ? <Navbar /> : null}
      <div className={`flex min-h-screen flex-1 flex-col w-full ${showSidebar ? 'lg:ml-52' : ''}`}>
        <main
          className={`flex-1 w-full ${
            isPublicRoute
              ? 'bg-white p-0'
              : isSimuladorRoute
                ? 'bg-[#F5F7FB] p-0'
                : isLegalRoute
                  ? 'bg-white p-0'
                : 'bg-[#F5F7FB] p-2.5 pt-14 pb-32 sm:p-6 sm:pt-20 lg:p-6'
          }`}
        >
          {children}
        </main>
        {showBottomNav ? <BottomNav /> : null}
        {!isPublicRoute && !isHomePage && !isLegalRoute && !isAdministradorRoute && <Footer />}
      </div>
    </div>
  );

  if (isAdministradorRoute) {
    return (
      <>
        {shell}
        <Toaster />
      </>
    );
  }

  return (
    <UserProvider>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {shell}
      <Toaster />
    </UserProvider>
  );
}
