'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  FileText,
  Home,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getShellProfileSummary } from '@/lib/client-shell-cache';
import { logError } from '@/lib/observability';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase-client';
import { getCareerRoute } from '@/lib/routes';

type NavbarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

type NavConfigItem = {
  label: string;
  href: string;
  icon: typeof Home;
  disabled?: boolean;
};

function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const navItems: NavConfigItem[] = [
  { label: 'Inicio', href: '/dashboard', icon: Home },
  { label: 'Mi espacio', href: '/dashboard/materiales', icon: FileText },
  { label: 'Calendario de exámenes', href: '/calendario', icon: CalendarDays },
  { label: 'Explicaciones IA', href: '/dashboard/explicaciones', icon: Sparkles },
];

function NavItem({
  href,
  label,
  active,
  collapsed,
  disabled,
  icon: Icon,
  dataTourAttr,
}: {
  href: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  disabled?: boolean;
  icon: typeof Home;
  dataTourAttr?: string;
}) {
  const baseClass = `group flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 ${
    active
      ? 'bg-[#EEF2FF] text-[#2563EB] shadow-[0_10px_24px_rgba(37,99,235,0.12)] dark:bg-indigo-500/15 dark:text-indigo-300 dark:shadow-none'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
  } ${collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : 'gap-2 px-3 py-2'}`;

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
      title={collapsed ? label : undefined}
      className={baseClass}
      {...(dataTourAttr ? { [dataTourAttr]: 'true' } : {})}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}

export function Navbar({ collapsed, onToggleCollapsed }: NavbarProps) {
  const pathname = usePathname();
  const { user, getUserInitials, getUserName } = useUser();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const dashboardNavLabel = isNavItemActive(pathname, '/dashboard') ? 'Inicio' : 'Dashboard';
  const [careerShortcut, setCareerShortcut] = useState<{ id: string; nombre: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCareerShortcut() {
      if (!user) {
        if (active) {
          setCareerShortcut(null);
        }
        return;
      }

      try {
        const summary = await getShellProfileSummary(user.id);
        if (!summary.carreraId || !summary.carreraNombre) {
          if (active) {
            setCareerShortcut(null);
          }
          return;
        }

        if (active) {
          setCareerShortcut({ id: summary.carreraId, nombre: summary.carreraNombre });
        }
      } catch (error) {
        logError('navbar.loadCareerShortcut', error, { userId: user.id });
        if (active) {
          setCareerShortcut(null);
        }
      }
    }

    void loadCareerShortcut();

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <aside
      className={`hidden border-r border-slate-100 bg-white transition-[width] duration-200 md:fixed md:bottom-0 md:left-0 md:top-[81px] md:z-20 md:block dark:border-slate-800 dark:bg-slate-950 ${
        collapsed ? 'w-[76px]' : 'w-[248px]'
      }`}
      onClick={collapsed ? onToggleCollapsed : undefined}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
          <nav className="space-y-1 pt-2">
            <div
              className={`grid items-center gap-2 ${
                collapsed ? 'grid-cols-1 justify-items-center' : 'grid-cols-[minmax(0,1fr)_40px]'
              }`}
            >
              <NavItem
                href={navItems[0].href}
                label={dashboardNavLabel}
                icon={navItems[0].icon}
                disabled={navItems[0].disabled}
                collapsed={collapsed}
                active={isNavItemActive(pathname, navItems[0].href)}
              />
              {!collapsed ? (
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  aria-label="Ocultar barra lateral"
                  title="Ocultar barra lateral"
                  className="flex h-11 w-11 items-center justify-center text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
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
                active={!item.disabled && isNavItemActive(pathname, item.href)}
                dataTourAttr={item.label === 'Mi espacio' ? 'data-tour-nav-espacio' : undefined}
              />
            ))}

            {careerShortcut ? (
              <Link
                href={getCareerRoute(careerShortcut.id)}
                title={collapsed ? careerShortcut.nombre : undefined}
                className={`flex items-center rounded-xl text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 ${
                  collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : 'mt-3 gap-2 px-2 py-2'
                }`}
              >
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[12px] font-bold text-[#2563EB] dark:bg-indigo-500/15 dark:text-indigo-300">
                  {careerShortcut.nombre.charAt(0).toUpperCase()}
                </span>
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Tu carrera
                    </p>
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {careerShortcut.nombre}
                    </p>
                  </div>
                ) : null}
              </Link>
            ) : null}
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/configuracion"
                  title={collapsed ? 'Configuración' : undefined}
                  className={`flex items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:shadow-none dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
                    collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : 'w-full gap-2 px-2.5 py-2'
                  }`}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  {!collapsed ? <p className="text-sm font-medium">Configuración</p> : null}
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`flex items-center rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_100%)] dark:shadow-none dark:hover:border-slate-700 dark:hover:bg-slate-800 ${
                      collapsed ? 'mx-auto h-11 w-11 justify-center px-0 py-0' : 'w-full gap-2 px-2.5 py-2.5'
                    }`}
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-slate-800">
                      <AvatarFallback className="bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-xs font-bold text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                      {user.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} />
                      ) : null}
                    </Avatar>
                    {!collapsed ? (
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {getUserName()}
                        </p>
                      </div>
                    ) : null}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
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
                className={`flex items-center rounded-xl bg-slate-50 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
                  collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : 'w-full gap-2 px-2 py-2'
                }`}
              >
                <LogIn className="h-4 w-4 shrink-0" />
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Iniciar sesión</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">Guardá tu progreso y tus materias</p>
                  </div>
                ) : null}
              </Link>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
