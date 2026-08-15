'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
  Flame,
  GraduationCap,
  Home,
  LogIn,
  LogOut,
  Settings,
  Sparkles,
  Search,
} from 'lucide-react';
import { UserProvider, useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase-client';
import { getCachedStreakSnapshot, getShellProfileSummary } from '@/lib/client-shell-cache';
import { logError } from '@/lib/observability';
import { Toaster } from '@/components/ui/toaster';
import { DeferredAppAnalytics } from '@/components/DeferredAppAnalytics';
import { NotificationBell } from '@/components/notifications/notification-bell';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Footer = dynamic(() => import('./footer').then((module) => module.Footer));
const Navbar = dynamic(() => import('./navbar').then((module) => module.Navbar));

function getArgentinaDayKey(dateInput: Date | string) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';

  return `${year}-${month}-${day}`;
}

function shiftDayKey(dayKey: string, offset: number) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + offset);
  return shifted.toISOString().slice(0, 10);
}

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
  const nextMilestone = milestones.find((value) => value > streakDays) ?? Math.max(35, streakDays + 7);
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
  const bottomNavItems = [
    { label: 'Inicio', href: '/dashboard', icon: Home },
    { label: 'Explorar', href: '/explorar', icon: Search },
    {
      label: 'Materias',
      href: '/materias',
      icon: GraduationCap,
    },
    user
      ? { label: 'Premium', href: '/pricing', icon: Crown, variant: 'cta' as const }
      : { label: 'Ingresar', href: '/login', icon: LogIn, variant: 'cta' as const },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/90 bg-white/96 pb-safe backdrop-blur md:hidden">
      <div className="grid grid-cols-4 items-stretch gap-1 px-2 py-1.5">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={
                item.variant === 'cta'
                  ? 'mx-0.5 flex min-h-[50px] flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-2 py-1.5 text-white shadow-[0_8px_20px_rgba(37,99,235,0.26)]'
                  : `flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 ${
                      isActive ? 'text-[#2563EB]' : 'text-slate-500'
                    }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              <span className="text-[9px] font-medium">
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
  return (
    <UserProvider>
      <ClientLayoutInner>{children}</ClientLayoutInner>
      <Toaster />
    </UserProvider>
  );
}

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, getUserInitials, getUserName } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileSummary, setProfileSummary] = useState<{
    carreraNombre: string | null;
    universidadNombre: string | null;
  }>({
    carreraNombre: null,
    universidadNombre: null,
  });
  const [streakDays, setStreakDays] = useState(0);
  const [streakDayKeys, setStreakDayKeys] = useState<string[]>([]);
  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const isSimuladorRoute = pathname.startsWith('/simulador');
  const isLegalRoute =
    pathname === '/copyright' || pathname === '/terminos' || pathname === '/privacidad';
  const isAdministradorRoute = pathname.startsWith('/administrador');
  const isExploreExperienceRoute =
    pathname === '/explorar' ||
    pathname.startsWith('/universidad/') ||
    pathname === '/materias' ||
    pathname.startsWith('/explorar/materia/');
  const showBottomNav = !isAdministradorRoute && !isSimuladorRoute && !isLegalRoute;
  const showTopBar = !isAdministradorRoute && !isSimuladorRoute && !isLegalRoute;
  const showSidebar = showTopBar && Boolean(user);
  const todayKey = getArgentinaDayKey(new Date());
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

  useEffect(() => {
    let active = true;

    async function loadShellData() {
      if (!user) {
        if (active) {
          setProfileSummary({ carreraNombre: null, universidadNombre: null });
          setStreakDays(0);
          setStreakDayKeys([]);
        }
        return;
      }

      try {
        const [summary, streakSnapshot] = await Promise.all([
          getShellProfileSummary(user.id),
          getCachedStreakSnapshot(user.id, getArgentinaDayKey, shiftDayKey),
        ]);

        if (active) {
          setProfileSummary({
            carreraNombre: summary.carreraNombre,
            universidadNombre: summary.universidadNombre,
          });
          setStreakDays(streakSnapshot.streakDays);
          setStreakDayKeys(streakSnapshot.streakDayKeys);
        }
      } catch (error) {
        logError('shell.loadData', error, { userId: user.id });
        if (active) {
          setProfileSummary({ carreraNombre: null, universidadNombre: null });
          setStreakDays(0);
          setStreakDayKeys([]);
        }
      }
    }

    void loadShellData();

    return () => {
      active = false;
    };
  }, [user]);

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
    <div className="flex min-h-screen flex-col bg-white">
      {showTopBar ? (
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/96 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-6 sm:py-3">
            <Link href="/" className="transition hover:opacity-85">
              <div className="text-[1.05rem] font-bold tracking-tight text-slate-900 sm:text-lg">
                Evaluo
              </div>
              <p className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">
                Tu espacio académico
              </p>
            </Link>
            {!user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:h-11 sm:px-4 sm:text-sm"
                >
                  Iniciar
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:opacity-95 sm:h-11 sm:px-4 sm:text-sm"
                >
                  <span className="sm:hidden">Registrate</span>
                  <span className="hidden sm:inline">Registrate gratis</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={() => setShowStreakDialog(true)}
                  className="inline-flex max-w-[82vw] items-center gap-2.5 rounded-[24px] border border-slate-200/90 bg-white px-2.5 py-2 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)] sm:max-w-none sm:gap-3 sm:px-3 sm:py-2.5"
                >
                  <Avatar className="h-10 w-10 border border-slate-200/80 ring-2 ring-white sm:h-11 sm:w-11">
                    <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-xs font-bold text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                    {user.user_metadata?.avatar_url ? (
                      <AvatarImage src={user.user_metadata.avatar_url} />
                    ) : null}
                  </Avatar>

                  <div className="hidden min-w-0 flex-1 sm:block">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[0.92rem] font-semibold tracking-[-0.01em] text-slate-900">
                        {getUserName()}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#DCE7FF] bg-[#EEF4FF] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">
                        <Sparkles className="h-3 w-3" />
                        Activo
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {profileSummary.carreraNombre && profileSummary.universidadNombre
                        ? `${profileSummary.carreraNombre} | ${profileSummary.universidadNombre}`
                        : profileSummary.carreraNombre || profileSummary.universidadNombre || 'Tu perfil'}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1 sm:hidden">
                    <p className="truncate text-sm font-semibold tracking-[-0.01em] text-slate-900">
                      {getUserName()}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {profileSummary.carreraNombre || 'Tu perfil'}
                    </p>
                  </div>

                  <div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#DCE7FF] bg-[#EEF4FF] px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm">
                      <Flame className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-[#1D4ED8]">
                      {streakDays}
                    </span>
                  </div>
                </button>
                </div>

                <Dialog open={showStreakDialog} onOpenChange={setShowStreakDialog}>
                <DialogContent
                  showCloseButton={false}
                  overlayClassName="bg-[#081224]/58 backdrop-blur-[2px]"
                  className="w-[calc(100vw-1.5rem)] max-w-[380px] overflow-hidden rounded-[28px] border border-[#E9EEF8] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(247,250,255,0.96)_55%,rgba(241,246,255,0.98)_100%)] p-0 shadow-[0_28px_90px_rgba(8,18,36,0.22)]"
                >
                  <div className="relative px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
                    <button
                      type="button"
                      onClick={() => setShowStreakDialog(false)}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-600"
                      aria-label="Cerrar resumen de racha"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>

                    <DialogHeader className="items-center text-center">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_35%,#DDE8FF_0%,#7BA7FF_42%,#2563EB_100%)] shadow-[0_12px_30px_rgba(37,99,235,0.24)]">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-[#2563EB]">
                          <Flame className="h-5 w-5" />
                        </div>
                      </div>
                      <DialogTitle className="mt-3 text-[3.2rem] font-bold leading-none tracking-[-0.08em] text-[#091225]">
                        {streakDays}
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-sm font-semibold text-[#2563EB]">
                        {streakLabel}
                      </DialogDescription>
                      <p className="mt-2 max-w-[250px] text-xs leading-5 text-slate-500">
                        Sigue entrando cada día para mantener tu impulso y volver más rápido a estudiar.
                      </p>
                    </DialogHeader>

                    <div className="mt-5 rounded-[22px] border border-[#EDF2FA] bg-white/88 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-[-0.02em] text-[#10214C]">
                          Esta semana
                        </p>
                        <p className="text-xs font-semibold text-[#2563EB]">
                          {Math.min(streakDays, 7)} de 7
                        </p>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between gap-1 text-center">
                          {weekDayEntries.map((day) => (
                            <div
                              key={`${day.label}-label`}
                              className="w-8 shrink-0"
                            >
                              <span
                                className={`block text-[9px] font-bold tracking-[0.06em] ${
                                  day.isToday ? 'text-[#2563EB]' : 'text-slate-500'
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
                                    ? 'border-[#3B82F6] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_4px_0_#1D4ED8,0_8px_18px_rgba(37,99,235,0.20)]'
                                    : 'border-slate-200 bg-white text-transparent'
                                }`}
                                style={day.isActive ? { backgroundColor: '#2563EB' } : undefined}
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

                    <div className="mt-3 rounded-[22px] border border-[#EDF2FA] bg-white/88 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold tracking-[-0.02em] text-[#10214C]">
                            Próximo hito {streakMilestone.nextMilestone}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {streakMilestone.remainingDays === 0
                              ? 'Ya alcanzaste este objetivo.'
                              : `Te faltan ${streakMilestone.remainingDays} ${streakMilestone.remainingDays === 1 ? 'día' : 'días'}.`}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[10px] font-semibold text-[#2563EB]">
                          Racha activa
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EEF2F8]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#2563EB_0%,#4F46E5_100%)] transition-all"
                          style={{ width: `${streakMilestone.progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowStreakDialog(false)}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563EB_0%,#4F46E5_100%)] text-sm font-semibold text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)] transition hover:opacity-95"
                    >
                      Sigue estudiando
                    </button>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <Link
                        href="/configuracion"
                        onClick={() => setShowStreakDialog(false)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Configuración
                      </Link>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                        onClick={async () => {
                          const { error } = await supabase.auth.signOut();
                          if (error) {
                            logError('shell.signOut', error, { userId: user.id });
                          }
                        }}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </DialogContent>
                </Dialog>
                </>
            )}
          </div>
          <div className="h-px w-full bg-slate-200" />
        </header>
      ) : null}
      <div className="flex min-h-0 flex-1">
        {showSidebar ? <Navbar collapsed={sidebarCollapsed} onToggleCollapsed={handleSidebarToggle} /> : null}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col ${
            showSidebar ? (sidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[248px]') : ''
          }`}
        >
          <main
            className={`min-w-0 flex-1 w-full ${
              isSimuladorRoute
                ? 'bg-[#F5F7FB] p-0'
                : isLegalRoute
                  ? 'bg-white p-0'
                  : isExploreExperienceRoute
                    ? 'bg-[#F5F7FB] px-0 pb-24 pt-0 sm:px-0 sm:pb-32 sm:pt-0 lg:p-0'
                    : 'bg-[#F5F7FB] p-2 pb-24 sm:p-6 sm:pb-32 lg:p-6'
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

