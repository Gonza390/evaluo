'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Crown, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

const navItems = [{ label: 'Mis materias', href: '/dashboard', icon: BookOpen }];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { loading } = useUser();

  if (loading) {
    return (
      <aside className="border-border bg-card flex h-screen w-52 flex-col border-r">
        <div className="flex h-16 items-center justify-center">
          <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {Array.from({ length: 1 }).map((_, index) => (
            <div key={index} className="bg-muted/50 mx-2 h-10 animate-pulse rounded-lg" />
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="border-border bg-card flex h-screen w-52 flex-col border-r">
      <div className="mt-4 flex h-12 items-center justify-center">
        <GraduationCap className="h-6 w-6 text-[#4F5DFF]" />
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-2 py-4">
        <div className="rounded-xl bg-[#F3F4FF] p-4 text-center">
          <Crown className="mx-auto h-6 w-6 text-[#5D5FEF]" />
          <h4 className="mt-2 text-xs font-bold text-slate-900">Potencia tu estudio</h4>
          <p className="mt-1 text-[10px] text-slate-500">
            Obtén respuestas ilimitadas, explicaciones avanzadas y más.
          </p>
          <button className="mt-3 w-full rounded-xl bg-[#5D5FEF] py-1.5 text-xs font-semibold text-white">
            Mejorar plan
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 px-2 py-3">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-900">
          Estudiando ahora
        </h3>
        <div className="rounded-2xl bg-slate-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">Universidad Siglo 21</p>
              <p className="truncate text-xs text-slate-600">Abogacía</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
