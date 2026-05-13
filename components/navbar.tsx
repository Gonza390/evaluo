'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Building2,
  ChevronDown,
  Crown,
  Heart,
  House,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/hooks/useUser';
import { isAdminUserSession } from '@/lib/roles';
import { supabase } from '@/lib/supabase-client';

const mainNavItems = [
  { label: 'Inicio', href: '/', icon: House, exact: true },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Materias favoritas', href: '/dashboard#materias-favoritas', icon: Heart },
];

const exploreNavItems = [
  { label: 'Universidades', href: '/explorar', icon: Building2 },
];

export function Navbar() {
  const { user, getUserInitials, getUserName } = useUser();
  const pathname = usePathname();
  const isAdmin = isAdminUserSession(user);

  const sidebarContent = (
    <div className="flex h-full flex-col px-3 py-3">
      <Link href="/" className="px-2 py-1.5">
        <div className="text-lg font-black tracking-tight text-slate-900">Evaluo</div>
        <p className="mt-0.5 text-[10px] text-slate-500">Tu espacio academico</p>
      </Link>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_10px_24px_rgba(79,93,255,0.12)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="mb-1.5 mt-3 px-3">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Explorar
          </span>
        </div>

        {exploreNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_10px_24px_rgba(79,93,255,0.12)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isAdmin ? (
          <Link
            href="/admin"
            className={`group mt-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-300 ${
              pathname.startsWith('/admin')
                ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_10px_24px_rgba(79,93,255,0.12)]'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
            <span>Admin</span>
          </Link>
        ) : null}
      </nav>

      <div className="mb-3 rounded-2xl bg-[#F3F4FF] p-3">
        <div className="flex flex-col items-center text-center">
          <Crown className="h-4 w-4 text-[#5D5FEF]" />
          <h4 className="mt-1.5 text-[10px] font-bold text-slate-900">Potencia tu estudio</h4>
          <p className="mt-0.5 text-[9px] leading-tight text-slate-500">
            Obten respuestas ilimitadas, explicaciones avanzadas y mas.
          </p>
          <Button
            asChild
            className="mt-2 w-full rounded-xl bg-[#5D5FEF] py-1 text-[10px] font-semibold text-white hover:bg-[#4F4FDF]"
          >
            <Link href={user ? '/pricing' : '/login'}>{user ? 'Mejorar plan' : 'Ver planes'}</Link>
          </Button>
          {!user ? (
            <Button
              asChild
              variant="outline"
              className="mt-2 h-auto w-full rounded-xl border-[#5D5FEF]/30 bg-white py-1 text-[10px] font-semibold text-[#4F5DFF] hover:bg-[#EEF2FF] hover:text-[#4F5DFF]"
            >
              <Link href="/login">Iniciar sesion</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-2 py-2 text-left transition hover:bg-slate-100">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-emerald-100 text-xs font-bold text-emerald-800">
                {getUserInitials()}
              </AvatarFallback>
              {user.user_metadata?.avatar_url ? (
                <AvatarImage src={user.user_metadata.avatar_url} />
              ) : null}
            </Avatar>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-slate-900">{getUserName()}</p>
              <p className="truncate text-[10px] text-slate-500">Plan estudiante</p>
            </div>
            <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="w-full text-sm">
                <BookOpen className="mr-2 h-4 w-4" />
                Mi dashboard
              </Link>
            </DropdownMenuItem>
            {isAdmin ? (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="w-full text-sm">
                  Panel de administracion
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm text-red-600 focus:bg-red-600 focus:text-white"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.error('Error signing out:', error);
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );

  return (
    <aside className="hidden h-screen w-52 border-r border-slate-100 bg-white lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex">
      <div className="w-full">{sidebarContent}</div>
    </aside>
  );
}
