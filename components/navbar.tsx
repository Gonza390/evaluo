'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  CircleHelp,
  Crown,
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
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { useShellData } from '@/components/ShellDataProvider';
import { ReferralPortalNavLink } from '@/components/referrals/ReferralPortalNavLink';
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
  const baseClass = `group flex items-center rounded-lg text-[13px] font-medium transition-colors duration-150 ${
    active
      ? 'bg-indigo-50/80 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
  } ${collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : 'gap-2.5 px-3 py-2.5'}`;

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
  const { profileSummary } = useShellData();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const dashboardNavLabel = isNavItemActive(pathname, '/dashboard') ? 'Inicio' : 'Dashboard';
  const careerShortcut =
    profileSummary.carreraId && profileSummary.carreraNombre
      ? { id: profileSummary.carreraId, nombre: profileSummary.carreraNombre }
      : null;

  return (
    <aside
      className={`hidden border-r border-slate-200/80 bg-white transition-[width] duration-200 md:fixed md:top-[81px] md:bottom-0 md:left-0 md:z-20 md:block ${
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800"
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

            {user ? <ReferralPortalNavLink collapsed={collapsed} pathname={pathname} /> : null}

            {careerShortcut ? (
              <Link
                href={getCareerRoute(careerShortcut.id)}
                title={collapsed ? careerShortcut.nombre : undefined}
                className={`flex items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 ${
                  collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : 'mt-3 gap-2.5 px-3 py-2.5'
                }`}
              >
                <span className="text-brand inline-flex h-4 w-4 shrink-0 items-center justify-center text-[12px] font-bold">
                  {careerShortcut.nombre.charAt(0).toUpperCase()}
                </span>
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                      Tu carrera
                    </p>
                    <p className="truncate text-sm font-medium text-slate-800">
                      {careerShortcut.nombre}
                    </p>
                  </div>
                ) : null}
              </Link>
            ) : null}
          </nav>

          <div className="mt-auto border-t border-slate-200/80 pt-3">
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/pricing"
                  title={collapsed ? 'Planes y suscripción' : undefined}
                  className={`text-brand flex items-center rounded-lg transition-colors hover:bg-indigo-50/70 ${
                    collapsed
                      ? 'mx-auto h-10 w-10 justify-center px-0 py-0'
                      : 'w-full gap-2.5 px-3 py-2.5'
                  }`}
                >
                  <Crown className="h-4 w-4 shrink-0" />
                  {!collapsed ? <p className="text-sm font-semibold">Planes y suscripción</p> : null}
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
                      : 'w-full gap-2.5 px-3 py-2.5'
                  }`}
                >
                  <CircleHelp className="h-4 w-4 shrink-0" />
                  {!collapsed ? <p className="text-sm font-medium">Ayuda</p> : null}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`flex items-center rounded-lg text-left text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 ${
                      collapsed
                        ? 'mx-auto h-11 w-11 justify-center px-0 py-0'
                        : 'w-full gap-2.5 px-3 py-2.5'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="from-brand to-brand-2 bg-gradient-to-br text-xs font-bold text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                      {user.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} />
                      ) : null}
                    </Avatar>
                    {!collapsed ? (
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-slate-900">
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
      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        sourcePath={pathname}
      />
    </aside>
  );
}
