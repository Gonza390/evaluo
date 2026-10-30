'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  CircleAlert,
  CircleHelp,
  Crown,
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
};

function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard/explicaciones' && pathname === '/dashboard/progreso') return true;
  if (href === '/dashboard') {
    // El lector de materiales es parte de Mi espacio.
    return pathname === href || pathname.startsWith('/materiales/');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const navItems: NavConfigItem[] = [
  { label: 'Mi espacio', href: '/dashboard', icon: Home },
  { label: 'Calendario', href: '/calendario', icon: CalendarDays },
  { label: 'Progreso', href: '/dashboard/explicaciones', icon: CircleAlert },
];

function NavItem({
  href,
  label,
  active,
  collapsed,
  disabled,
  icon: Icon,
  dataTourAttr,
  compact = false,
}: {
  href: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  disabled?: boolean;
  icon: typeof Home;
  dataTourAttr?: string;
  compact?: boolean;
}) {
  const baseClass = `group relative z-10 flex items-center rounded-lg ${compact ? 'text-[12px]' : 'text-[13px]'} font-medium transition-colors duration-150 ${
    active
      ? 'text-primary font-semibold'
      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
  } ${collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : compact ? 'min-h-10 gap-2 px-2.5 py-2' : 'gap-2.5 px-3 py-2.5'}`;

  if (disabled) {
    return (
      <button
        type="button"
        title={collapsed ? label : undefined}
        className={`${baseClass} cursor-default opacity-75`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed ? <span>{label}</span> : null}
      </button>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      data-evaluo-sidebar-link={active ? 'active' : undefined}
      title={collapsed ? label : undefined}
      className={baseClass}
      {...(dataTourAttr ? { [dataTourAttr]: 'true' } : {})}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}

export function Navbar({ collapsed, onToggleCollapsed, compact = false }: NavbarProps) {
  const pathname = usePathname();
  const { user, getUserInitials, getUserName } = useUser();
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
        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${compact ? "px-2 py-2.5" : "px-3 py-4"}`}>
          <nav ref={navRef} aria-label="Navegación principal" className={`relative space-y-1 ${compact ? "pt-5" : "pt-2"}`}>
            <div
              className={`grid items-center ${compact ? 'gap-1' : 'gap-2'} ${
                collapsed ? 'grid-cols-1 justify-items-center' : compact ? 'grid-cols-[minmax(0,1fr)_32px]' : 'grid-cols-[minmax(0,1fr)_40px]'
              }`}
            >
              <NavItem
                href={navItems[0].href}
                label={navItems[0].label}
                icon={navItems[0].icon}
                disabled={navItems[0].disabled}
                collapsed={collapsed}
                compact={compact}
                active={isNavItemActive(pathname, navItems[0].href)}
              />
              {!collapsed ? (
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  aria-label="Ocultar barra lateral"
                  title="Ocultar barra lateral"
                  className={`flex h-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 ${compact ? 'w-8' : 'w-10'}`}
                >
                  <ToggleIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {navItems.slice(1).map((item) => (
              <NavItem
                key={item.label}
                href={item.href}
                label={item.label}
                icon={item.icon}
                disabled={item.disabled}
                collapsed={collapsed}
                compact={compact}
                active={!item.disabled && isNavItemActive(pathname, item.href)}
                dataTourAttr={
                  item.href === '/dashboard/explicaciones' ? 'data-recommended-errors' : undefined
                }
              />
            ))}

            {user ? <ReferralPortalNavLink collapsed={collapsed} pathname={pathname} compact={compact} /> : null}
            {activeIndicator ? (
              <span
                data-evaluo-sidebar-indicator
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 !m-0 rounded-lg bg-primary/7"
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
                  href="/pricing"
                  title={collapsed ? 'Planes y suscripción' : undefined}
                  className={`text-brand flex items-center rounded-lg transition-colors hover:bg-blue-50/70 ${
                    collapsed
                      ? 'mx-auto h-10 w-10 justify-center px-0 py-0'
                      : compact ? 'min-h-10 w-full gap-2 px-2.5 py-2 text-[12px]' : 'w-full gap-2.5 px-3 py-2.5'
                  }`}
                >
                  <Crown className="h-4 w-4 shrink-0" />
                  {!collapsed ? (
                    <p className={compact ? "whitespace-nowrap text-[12px] font-semibold" : "text-sm font-semibold"}>Planes y suscripción</p>
                  ) : null}
                </Link>

                <button
                  type="button"
                  title={collapsed ? 'Ayuda' : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFeedbackOpen(true);
                  }}
                  className={`flex items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 ${
                    collapsed
                      ? 'mx-auto h-10 w-10 justify-center px-0 py-0'
                      : compact ? 'min-h-10 w-full gap-2 px-2.5 py-2 text-[12px]' : 'w-full gap-2.5 px-3 py-2.5'
                  }`}
                >
                  <CircleHelp className="h-4 w-4 shrink-0" />
                  {!collapsed ? <p className={compact ? "text-[12px] font-medium" : "text-sm font-medium"}>Ayuda</p> : null}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`flex items-center rounded-lg text-left text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 ${
                      collapsed
                        ? 'mx-auto h-11 w-11 justify-center px-0 py-0'
                        : compact ? 'min-h-10 w-full gap-2 px-2.5 py-2' : 'w-full gap-2.5 px-3 py-2.5'
                    }`}
                  >
                    <Avatar className={compact ? 'h-7 w-7 shrink-0' : 'h-8 w-8'}>
                      <AvatarFallback className="from-brand to-brand-2 bg-gradient-to-br text-xs font-bold text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                      {user.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} />
                      ) : null}
                    </Avatar>
                    {!collapsed ? (
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className={`truncate font-semibold text-slate-900 ${compact ? "text-[12px]" : "text-sm"}`}>
                          {getUserName()}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">Tu perfil</p>
                      </div>
                    ) : null}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/configuracion" className="w-full text-sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm text-red-600 focus:bg-red-600 focus:text-white"
                      onClick={async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                          logError('navbar.signOut', error, { userId: user.id });
                        }
                        window.location.assign('/login');
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link
                href="/login"
                title={collapsed ? 'Iniciar sesión' : undefined}
                className={`flex items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 ${
                  collapsed
                    ? 'mx-auto h-10 w-10 justify-center px-0 py-0'
                    : 'w-full gap-2.5 px-3 py-2.5'
                }`}
              >
                <LogIn className="h-4 w-4 shrink-0" />
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Iniciar sesión</p>
                    <p className="text-[12px] text-slate-500">Guardá tu progreso y tus materias</p>
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
