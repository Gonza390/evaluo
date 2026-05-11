'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, BookOpen, Crown } from 'lucide-react';
import { Footer } from './footer';
import { Navbar } from './navbar';
import { UserProvider } from '@/hooks/useUser';
import AnalyticsTracker from '@/components/AnalyticsTracker';

const bottomNavItems = [
  { label: 'Inicio', href: '/dashboard', icon: Home },
  { label: 'Explorar', href: '/explorar', icon: Search },
  { label: 'Materias', href: '/materias', icon: BookOpen },
  { label: 'Potencia', href: '/login', icon: Crown, variant: 'cta' as const },
];

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-safe lg:hidden">
      <div className="grid grid-cols-4 items-stretch gap-1 px-2 py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={
                item.variant === 'cta'
                  ? 'mx-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-[#4F5DFF] to-[#6D5EF8] px-2 py-2 text-white shadow-[0_8px_20px_rgba(79,93,255,0.30)]'
                  : `flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 ${
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
  const showSidebar =
    !pathname.startsWith('/admin') && !isPublicRoute && !isSimuladorRoute && !isLegalRoute;
  const showBottomNav =
    !pathname.startsWith('/admin') && !isPublicRoute && !isSimuladorRoute && !isLegalRoute;
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
                : 'bg-[#F5F7FB] p-3 pt-14 pb-28 sm:p-6 sm:pt-20 lg:p-6'
          }`}
        >
          {children}
        </main>
        {showBottomNav ? <BottomNav /> : null}
        {!isPublicRoute && !isHomePage && !isLegalRoute && <Footer />}
      </div>
    </div>
  );

  return (
    <UserProvider>
      <AnalyticsTracker />
      {shell}
    </UserProvider>
  );
}
