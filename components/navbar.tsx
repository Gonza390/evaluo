'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  ListChecks,
  CircleAlert,
  CircleHelp,
  TrendingUp,
  ChevronRight,
  Home,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { ReferralPortalNavLink } from '@/components/referrals/ReferralPortalNavLink';
import { logError } from '@/lib/observability';
import { useUser } from '@/hooks/useUser';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { supabase } from '@/lib/supabase-client';

type NavbarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  compact?: boolean;
};

type NavConfigItem = {
  label: string;
  href: string;
  icon: typeof Home;
  disabled?: boolean;
  iconTone?: string;
};

function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard/estudiar' && pathname === '/dashboard/progreso') return true;
  if (href === '/dashboard') {
    // El lector de materiales es parte de Mi espacio.
    return pathname === href || pathname.startsWith('/materiales/');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const navItems: NavConfigItem[] = [
  { label: 'Mi espacio', href: '/dashboard', icon: Home, iconTone: 'bg-blue-50 text-blue-700' },
  { label: 'Estudiar', href: '/dashboard/estudiar', icon: BookOpen, iconTone: 'bg-sky-50 text-sky-700' },
  { label: 'Practicar', href: '/dashboard/practicar', icon: ListChecks, iconTone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Plan de estudio', href: '/dashboard/plan-de-estudio', icon: ClipboardList, iconTone: 'bg-violet-50 text-violet-700' },
  { label: 'Calendario', href: '/calendario', icon: CalendarDays, iconTone: 'bg-amber-50 text-amber-700' },
];

function NavItem({
  href,
  label,
  active,
  collapsed,
  disabled,
  icon: Icon,
  iconTone = 'bg-slate-100 text-slate-600',
  dataTourAttr,
  compact = false,
}: {
  href: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  disabled?: boolean;
  icon: typeof Home;
  iconTone?: string;
  dataTourAttr?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  useEffect(() => { if (pendingFrom !== null && pathname !== pendingFrom) setPendingFrom(null); }, [pathname, pendingFrom]);
  const pending = pendingFrom === pathname && !active;
  const baseClass = `group relative z-10 flex items-center rounded-lg ${compact ? 'text-chico' : 'text-ui'} transition-colors duration-150 ${
    active
      ? 'text-slate-900 font-medium'
      : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
  } ${collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : compact ? 'min-h-10 gap-2 px-1.5 py-1' : 'min-h-11 gap-2.5 px-2 py-1.5'}`;

  if (disabled) {
    return (
      <button
        type="button"
        title={collapsed ? label : undefined}
        className={`${baseClass} cursor-default opacity-75`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}><Icon className="h-4 w-4" /></span>
        {!collapsed ? <span>{label}</span> : null}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => { if (!active) setPendingFrom(pathname); }}
      aria-busy={pending || undefined}
      aria-current={active ? 'page' : undefined}
      data-evaluo-sidebar-link={active ? 'active' : undefined}
      title={collapsed ? label : undefined}
      className={baseClass}
      {...(dataTourAttr ? { [dataTourAttr]: 'true' } : {})}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}><Icon className={`h-4 w-4 ${pending ? 'animate-pulse' : ''}`} /></span>
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}

export function Navbar({ collapsed, onToggleCollapsed, compact = false }: NavbarProps) {
  const pathname = usePathname();
  const { user, getUserInitials, getUserName } = useUser();
  const { messages, locale } = useAppLocale();
  const localizedNavItems = navItems.map((item) => ({
    ...item,
    label: ({
      '/dashboard': messages.navigation.mySpace,
      '/dashboard/estudiar': messages.navigation.study,
      '/dashboard/practicar': messages.navigation.practice,
      '/dashboard/plan-de-estudio': messages.navigation.studyPlan,
      '/calendario': messages.navigation.calendar,
    } as Record<string, string>)[item.href] ?? item.label,
  }));
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const [activeIndicator, setActiveIndicator] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const syncPosition = () => {
      const active = nav.querySelector<HTMLElement>('[data-evaluo-sidebar-link="active"]');
      if (!active) {
        setActiveIndicator(null);
        return;
      }
      const navBounds = nav.getBoundingClientRect();
      const bounds = active.getBoundingClientRect();
      const next = {
        top: bounds.top - navBounds.top,
        left: bounds.left - navBounds.left,
        width: bounds.width,
        height: bounds.height,
      };
      setActiveIndicator(previous =>
        previous &&
        previous.top === next.top &&
        previous.left === next.left &&
        previous.width === next.width &&
        previous.height === next.height
          ? previous
          : next
      );
    };
    syncPosition();
    const observer = new ResizeObserver(syncPosition);
    observer.observe(nav);
    const active = nav.querySelector<HTMLElement>('[data-evaluo-sidebar-link="active"]');
    if (active) observer.observe(active);
    window.addEventListener('resize', syncPosition);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncPosition);
    };
  }, [pathname, collapsed, compact]);

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <aside
      className={`hidden border-r border-slate-200/80 bg-white transition-[width,top] duration-200 md:fixed md:bottom-0 md:left-0 md:z-20 md:block ${
        compact ? 'md:top-[52px]' : 'md:top-[81px]'
      } ${collapsed ? (compact ? 'w-[56px]' : 'w-[76px]') : (compact ? 'w-[176px]' : 'w-[248px]')}`}
      onClick={collapsed ? onToggleCollapsed : undefined}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${compact ? "px-2 pt-0 pb-2.5" : "px-3 pt-1 pb-4"}`}>
          <nav ref={navRef} aria-label={messages.navigation.mainNavigation} className={`relative space-y-1 ${compact ? "pt-0" : "pt-0"}`}>
            <div
              className={`grid items-center ${compact ? 'gap-1' : 'gap-2'} ${
                collapsed ? 'grid-cols-1 justify-items-center' : compact ? 'grid-cols-[minmax(0,1fr)_32px]' : 'grid-cols-[minmax(0,1fr)_40px]'
              }`}
            >
              <NavItem
                href={localizedNavItems[0].href}
                label={localizedNavItems[0].label}
                icon={localizedNavItems[0].icon}
                iconTone={localizedNavItems[0].iconTone}
                disabled={localizedNavItems[0].disabled}
                collapsed={collapsed}
                compact={compact}
                active={isNavItemActive(pathname, localizedNavItems[0].href)}
              />
              {!collapsed ? (
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  aria-label={messages.navigation.hideSidebar}
                  title={messages.navigation.hideSidebar}
                  className={`flex h-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 ${compact ? 'w-8' : 'w-10'}`}
                >
                  <ToggleIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {localizedNavItems.slice(1).map((item) => (
              <NavItem
                key={item.label}
                href={item.href}
                label={item.label}
                icon={item.icon}
                iconTone={item.iconTone}
                disabled={item.disabled}
                collapsed={collapsed}
                compact={compact}
                active={!item.disabled && isNavItemActive(pathname, item.href)}
                dataTourAttr={
                  item.href === '/dashboard/estudiar' ? 'data-recommended-errors' : undefined
                }
              />
            ))}

            {user ? <ReferralPortalNavLink collapsed={collapsed} pathname={pathname} compact={compact} /> : null}
            {activeIndicator ? (
              <span
                data-evaluo-sidebar-indicator
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 !m-0 rounded-lg bg-slate-100/70"
                style={{
                  width: activeIndicator.width,
                  height: activeIndicator.height,
                  transform: `translate3d(${activeIndicator.left}px, ${activeIndicator.top}px, 0)`,
                }}
              />
            ) : null}
          </nav>

          <div className="mt-auto border-t border-slate-200/80 pt-3">
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/dashboard/premium"
                  data-sidebar-plan-upgrade
                  title={collapsed ? messages.navigation.improvePlan : undefined}
                  aria-label={collapsed ? messages.navigation.improvePlan : undefined}
                  aria-current={isNavItemActive(pathname, '/dashboard/premium') ? 'page' : undefined}
                  className={`group flex min-w-0 items-center rounded-xl text-[#0F1B3D] transition-colors hover:bg-[#EEF2FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D70C4] ${
                    collapsed
                      ? 'mx-auto h-10 w-10 justify-center p-0'
                      : compact ? 'min-h-10 w-full gap-2.5 px-2 py-1 text-chico' : 'min-h-11 w-full gap-2.5 px-2 py-1.5 text-ui'
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5D70C4] transition-colors group-hover:bg-[#E3E8FF] group-focus-visible:bg-[#E3E8FF]">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {!collapsed ? (
                    <>
                      <span className="min-w-0 flex-1 whitespace-nowrap font-semibold">{messages.navigation.improvePlan}</span>
                      {!compact ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#7F8AA3]" aria-hidden="true" /> : null}
                    </>
                  ) : null}
                </Link>

                <button
                  type="button"
                  title={collapsed ? messages.navigation.feedback : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFeedbackOpen(true);
                  }}
                  className={`flex items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 ${
                    collapsed
                      ? 'mx-auto h-10 w-10 justify-center px-0 py-0'
                      : compact ? 'min-h-10 w-full gap-2.5 px-2 py-1 text-chico' : 'min-h-11 w-full gap-2.5 px-2 py-1.5 text-ui'
                  }`}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg"><CircleHelp className="size-4" aria-hidden="true" /></span>
                  {!collapsed ? <span className="min-w-0 flex-1 text-left font-semibold">{messages.navigation.feedback}</span> : null}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`flex items-center rounded-lg text-left text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 ${
                      collapsed
                        ? 'mx-auto h-11 w-11 justify-center px-0 py-0'
                        : compact ? 'min-h-10 w-full gap-2.5 px-2 py-1' : 'min-h-11 w-full gap-2.5 px-2 py-1.5'
                    }`}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center">
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="from-brand to-brand-2 bg-gradient-to-br text-chico font-semibold text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                      {user.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} />
                      ) : null}
                    </Avatar>
                    </span>
                    {!collapsed ? (
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className={`truncate font-semibold text-slate-900 ${compact ? "text-chico" : "text-ui"}`}>
                          {getUserName()}
                        </p>
                      </div>
                    ) : null}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    sideOffset={2}
                    avoidCollisions={false}
                    className={`${collapsed ? "w-[224px]" : compact ? "w-[160px]" : "w-[224px]"} max-w-[calc(100vw-24px)] rounded-2xl border border-[#E7EBF4] bg-white p-2 shadow-[0_12px_32px_rgba(15,27,61,0.12)]`}
                  >
                    <div className="px-2 pb-3 pt-1">
                      {user.email ? (
                        <p className="truncate text-chico text-[#7F8AA3]">{user.email}</p>
                      ) : null}
                    </div>
                    <DropdownMenuItem asChild className="min-h-11 rounded-xl px-3 text-cuerpo font-medium text-[#42506A] focus:bg-[#F5F7FB] focus:text-[#0F1B3D]">
                      <Link href="/configuracion" className="flex w-full items-center gap-3">
                        <Settings className="!size-[18px] text-[#66758D]" aria-hidden="true" />
                        {messages.navigation.settings}
                      </Link>
                    </DropdownMenuItem>
                    <div role="separator" className="my-2 h-px bg-[#E7EBF4]" />
                    <DropdownMenuItem
                      className="min-h-11 gap-3 rounded-xl px-3 text-cuerpo font-medium text-[#C65353] focus:bg-[#FFF4F4] focus:text-[#B93838]"
                      onClick={async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                          logError('navbar.signOut', error, { userId: user.id });
                          return;
                        }
                        window.location.assign(locale === 'en' ? '/en/login' : '/login');
                      }}
                    >
                      <LogOut className="!size-[18px] text-current" aria-hidden="true" />
                      {messages.navigation.signOut}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link
                href={locale === 'en' ? '/en/login' : '/login'}
                title={collapsed ? (locale === 'en' ? 'Sign in' : 'Iniciar sesión') : undefined}
                className={`flex items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 ${
                  collapsed
                    ? 'mx-auto h-10 w-10 justify-center px-0 py-0'
                    : 'w-full gap-2.5 px-3 py-2.5'
                }`}
              >
                <LogIn className="h-4 w-4 shrink-0" />
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="text-cuerpo font-medium">{locale === 'en' ? 'Sign in' : 'Iniciar sesión'}</p>
                    <p className="text-chico text-slate-500">{locale === 'en' ? 'Save your progress and study materials' : 'Guardá tu progreso y tus materias'}</p>
                  </div>
                ) : null}
              </Link>
            )}
          </div>
        </div>
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} sourcePath={pathname} />
    </aside>
  );
}
