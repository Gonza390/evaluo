'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Crown,
  Flame,
  GraduationCap,
  Home,
  LogIn,
  LogOut,
  Settings,
  Search,
} from 'lucide-react';
import { UserProvider, useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase-client';
import { shiftDayKey } from '@/lib/calendar-utils';
import { logError } from '@/lib/observability';
import { ShellDataProvider, useShellData } from '@/components/ShellDataProvider';
import { DeferredAppAnalytics } from '@/components/DeferredAppAnalytics';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCareerRoute } from '@/lib/routes';

const Footer = dynamic(() => import('./footer').then((module) => module.Footer));
const Navbar = dynamic(() => import('./navbar').then((module) => module.Navbar));
const Toaster = dynamic(() => import('@/components/ui/toaster').then((module) => module.Toaster));
const NotificationBell = dynamic(() =>
  import('@/components/notifications/notification-bell').then((module) => module.NotificationBell)
);
const Dialog = dynamic(() => import('@/components/ui/dialog').then((module) => module.Dialog));
const DialogContent = dynamic(() =>
  import('@/components/ui/dialog').then((module) => module.DialogContent)
);
const DialogDescription = dynamic(() =>
  import('@/components/ui/dialog').then((module) => module.DialogDescription)
);
const DialogHeader = dynamic(() =>
  import('@/components/ui/dialog').then((module) => module.DialogHeader)
);
const DialogTitle = dynamic(() =>
  import('@/components/ui/dialog').then((module) => module.DialogTitle)
);

function getWeekdayIndexFromDayKey(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
}

function getWeekDayEntries(
  _activeDayKeys: string[],
  todayKey: string,
  _shiftDayKeyFn: (dayKey: string, offset: number) => string,
  streakDays: number
) {
  const labels = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
  const currentDayIndex = getWeekdayIndexFromDayKey(todayKey);

  return labels.map((label, index) => {
    const distanceFromToday = currentDayIndex - index;
    const isToday = index === currentDayIndex;
    const isActive = distanceFromToday >= 0 && distanceFromToday < streakDays;

    return {
      label,
      isToday,
      isActive,
    };
  });
}

function getNextStreakMilestone(streakDays: number) {
  const milestones = [3, 7, 14, 21, 30];
  const nextMilestone =
    milestones.find((value) => value > streakDays) ?? Math.max(35, streakDays + 7);
  const remainingDays = Math.max(0, nextMilestone - streakDays);
  const progress = nextMilestone > 0 ? Math.min(100, (streakDays / nextMilestone) * 100) : 0;

  return {
    nextMilestone,
    remainingDays,
    progress,
  };
}

function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { profileSummary } = useShellData();
  const materiasHref = profileSummary.carreraId
    ? getCareerRoute(profileSummary.carreraId)
    : '/explorar';
  const bottomNavItems = user
    ? [
        { label: 'Inicio', href: '/dashboard', icon: Home },
        { label: 'Explorar', href: '/explorar', icon: Search },
        { label: 'Materias', href: materiasHref, icon: GraduationCap },
        { label: 'Premium', href: '/pricing', icon: Crown, variant: 'cta' as const },
      ]
    : [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Explorar', href: '/explorar', icon: Search },
        { label: 'Pregunteros', href: '/pregunteros', icon: GraduationCap },
        { label: 'Ingresar', href: '/login', icon: LogIn, variant: 'cta' as const },
      ];

  return (
    <nav
      data-tour-nav-mobile="true"
      className="border-border bg-background/95 pb-safe fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-4 items-stretch gap-1 px-2 py-1.5">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/' || item.href === '/dashboard'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={
                item.variant === 'cta'
                  ? 'from-brand to-brand-2 mx-0.5 flex min-h-[50px] flex-col items-center justify-center rounded-2xl bg-gradient-to-r px-2 py-1.5 text-white shadow-[0_8px_20px_rgba(37,99,235,0.26)]'
                  : `flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 ${
                      isActive ? 'text-brand' : 'text-muted-foreground'
                    }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              <span className="text-[12px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function ClientLayoutClient({
  children,
  initialUser,
  initialProfileSummary,
}: {
  children: React.ReactNode;
  initialUser?: import('@supabase/supabase-js').User | null;
  initialProfileSummary?: import('@/lib/client-shell-cache').ShellProfileSummary;
}) {
  return (
    <UserProvider initialUser={initialUser}>
      <ShellDataProvider initialProfileSummary={initialProfileSummary}>
        <ClientLayoutInner>{children}</ClientLayoutInner>
      </ShellDataProvider>
      <Toaster />
    </UserProvider>
  );
}

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, getUserInitials, getUserName } = useUser();
  const { profileSummary, streak } = useShellData();
  const streakDays = streak?.streakDays ?? 0;
  const streakDayKeys = streak?.streakDayKeys ?? [];
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const isSimuladorRoute = pathname.startsWith('/simulador');
  const isLegalRoute =
    pathname === '/copyright' ||
    pathname === '/terminos' ||
    pathname === '/privacidad' ||
    pathname === '/facturacion';
  const isAdministradorRoute = pathname.startsWith('/administrador');
  const isExploreExperienceRoute =
    pathname === '/explorar' ||
    pathname.startsWith('/universidad/') ||
    pathname === '/materias' ||
    pathname.startsWith('/explorar/materia/');
  const showBottomNav = !isAdministradorRoute && !isSimuladorRoute && !isLegalRoute;
  const showTopBar = !isAdministradorRoute && !isSimuladorRoute && !isLegalRoute;
  const showSidebar = showTopBar && Boolean(user);
  const todayKey = streak?.todayKey ?? '';
  const weekDayEntries = getWeekDayEntries(streakDayKeys, todayKey, shiftDayKey, streakDays);
  const streakMilestone = getNextStreakMilestone(streakDays);
  const streakLabel = streakDays === 1 ? 'día de racha' : 'días de racha';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem('evaluo_sidebar_collapsed');
    setSidebarCollapsed(storedValue === 'true');
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('evaluo_sidebar_collapsed', String(nextValue));
      }
      return nextValue;
    });
  };

  const shell = (
    <div className="bg-background flex min-h-screen flex-col">
      {showTopBar ? (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-3 py-[9px] sm:px-6 sm:py-[11px]">
            <Link
              href={user ? '/dashboard' : '/'}
              className="group flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
            >
              <Image
                src="/icon.png"
                alt=""
                width={40}
                height={40}
                priority
                className="h-8 w-8 shrink-0 object-contain transition-transform group-hover:scale-[1.04] sm:h-9 sm:w-9"
              />
              <div className="min-w-0">
                <div className="truncate text-[1.05rem] font-bold tracking-[-0.025em] text-slate-950 sm:text-lg">
                  Evaluo
                </div>
                <p className="mt-0.5 hidden text-[11px] font-medium text-slate-400 sm:block">
                  Tu espacio académico
                </p>
              </div>
            </Link>
            {!user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-lg px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:px-4 sm:text-sm"
                >
                  Iniciar
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="from-brand to-brand-2 inline-flex h-11 items-center rounded-lg bg-gradient-to-r px-3 text-xs font-semibold text-white transition hover:opacity-95 sm:px-4 sm:text-sm"
                >
                  <span className="sm:hidden">Registrate</span>
                  <span className="hidden sm:inline">Registrate gratis</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-2.5">
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={() => setShowStreakDialog(true)}
                    className="inline-flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-slate-50 sm:gap-3 sm:px-2.5"
                  >
                    <Avatar className="flex h-8 w-8 shrink-0 sm:h-9 sm:w-9">
                      <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-xs font-bold text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                      {user.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} />
                      ) : null}
                    </Avatar>

                    <div className="hidden min-w-0 flex-1 sm:block">
                      <p className="truncate text-[0.88rem] font-semibold tracking-[-0.01em] text-slate-900">
                        {getUserName()}
                      </p>
                      <p className="mt-0.5 max-w-[250px] truncate text-[11px] text-slate-400">
                        {profileSummary.carreraNombre && profileSummary.universidadNombre
                          ? `${profileSummary.carreraNombre} | ${profileSummary.universidadNombre}`
                          : profileSummary.carreraNombre ||
                            profileSummary.universidadNombre ||
                            'Tu perfil'}
                      </p>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1 text-indigo-600">
                      <Flame className="h-4 w-4" />
                      <span className="text-xs font-semibold">{streakDays}</span>
                    </span>
                  </button>
                </div>

                {showStreakDialog ? (
                  <Dialog open onOpenChange={setShowStreakDialog}>
                    <DialogContent
                      showCloseButton={false}
                      overlayClassName="bg-[#081224]/58 backdrop-blur-[2px]"
                      className="border-border bg-card w-[calc(100vw-1.5rem)] max-w-[380px] overflow-hidden rounded-[28px] border p-0 shadow-[0_28px_90px_rgba(8,18,36,0.22)]"
                    >
                      <div className="relative px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
                        <button
                          type="button"
                          onClick={() => setShowStreakDialog(false)}
                          className="border-border bg-card/90 text-muted-foreground hover:border-input hover:text-foreground absolute top-2 right-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border p-2 shadow-sm transition"
                          aria-label="Cerrar resumen de racha"
                        >
                          <span className="text-lg leading-none">×</span>
                        </button>

                        <DialogHeader className="items-center text-center">
                          <div className="from-brand/40 to-brand inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br shadow-[0_12px_30px_rgba(37,99,235,0.24)]">
                            <div className="bg-card text-brand inline-flex h-10 w-10 items-center justify-center rounded-full">
                              <Flame className="h-5 w-5" />
                            </div>
                          </div>
                          <DialogTitle className="text-foreground mt-3 text-[3.2rem] leading-none font-bold tracking-[-0.08em]">
                            {streakDays}
                          </DialogTitle>
                          <DialogDescription className="text-brand mt-1 text-sm font-semibold">
                            {streakLabel}
                          </DialogDescription>
                          <p className="text-muted-foreground mt-2 max-w-[250px] text-xs leading-5">
                            Sigue entrando cada día para mantener tu impulso y volver más rápido a
                            estudiar.
                          </p>
                        </DialogHeader>

                        <div className="border-border bg-card/90 mt-5 rounded-[22px] border p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground text-xs font-semibold tracking-[-0.02em]">
                              Esta semana
                            </p>
                            <p className="text-brand text-xs font-semibold">
                              {Math.min(streakDays, 7)} de 7
                            </p>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between gap-1 text-center">
                              {weekDayEntries.map((day) => (
                                <div key={`${day.label}-label`} className="w-8 shrink-0">
                                  <span
                                    className={`block text-[12px] font-bold tracking-[0.06em] ${
                                      day.isToday ? 'text-brand' : 'text-muted-foreground'
                                    }`}
                                  >
                                    {day.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between gap-1.5">
                              {weekDayEntries.map((day) => (
                                <div key={day.label} className="flex w-8 shrink-0 justify-center">
                                  <span
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                                      day.isActive
                                        ? 'border-brand bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_4px_0_var(--brand),0_8px_18px_rgba(37,99,235,0.20)]'
                                        : 'border-border bg-card text-transparent'
                                    }`}
                                  >
                                    {day.isActive ? (
                                      <Flame className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                                    ) : null}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="border-border bg-card/90 mt-3 rounded-[22px] border p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-foreground text-xs font-semibold tracking-[-0.02em]">
                                Próximo hito {streakMilestone.nextMilestone}
                              </p>
                              <p className="text-muted-foreground mt-1 text-[12px]">
                                {streakMilestone.remainingDays === 0
                                  ? 'Ya alcanzaste este objetivo.'
                                  : `Te faltan ${streakMilestone.remainingDays} ${streakMilestone.remainingDays === 1 ? 'día' : 'días'}.`}
                              </p>
                            </div>
                            <span className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-[12px] font-semibold">
                              Racha activa
                            </span>
                          </div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                            <div
                              className="from-brand to-brand-2 h-full rounded-full bg-gradient-to-r transition-all"
                              style={{ width: `${streakMilestone.progress}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowStreakDialog(false)}
                          className="from-brand to-brand-2 mt-4 inline-flex h-10 w-full items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-semibold text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)] transition hover:opacity-95"
                        >
                          Sigue estudiando
                        </button>

                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                          <Link
                            href="/configuracion"
                            onClick={() => setShowStreakDialog(false)}
                            className="border-border bg-card text-foreground hover:border-input inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition hover:bg-white"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            Configuración
                          </Link>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                            onClick={async () => {
                              const { error } = await supabase.auth.signOut();
                              if (error) {
                                logError('shell.signOut', error, { userId: user.id });
                              }
                              window.location.assign('/login');
                            }}
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : null}
              </>
            )}
          </div>
        </header>
      ) : null}
      <div className="flex min-h-0 flex-1">
        {showSidebar ? (
          <Navbar collapsed={sidebarCollapsed} onToggleCollapsed={handleSidebarToggle} />
        ) : null}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col ${
            showSidebar ? (sidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[248px]') : ''
          }`}
        >
          <main
            className={`w-full min-w-0 flex-1 ${
              isSimuladorRoute
                ? 'bg-white p-0'
                : isLegalRoute
                  ? 'bg-background p-0'
                  : isExploreExperienceRoute
                    ? 'bg-white px-0 pt-0 pb-24 sm:px-0 sm:pt-0 sm:pb-32 lg:p-0'
                    : 'bg-white p-2 pb-24 sm:p-6 sm:pb-32 lg:p-6'
            }`}
          >
            {children}
          </main>
          {showBottomNav ? <BottomNav /> : null}
          {!isLegalRoute && !isAdministradorRoute ? <Footer /> : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Suspense fallback={null}>
        <DeferredAppAnalytics />
      </Suspense>
      {shell}
    </>
  );
}