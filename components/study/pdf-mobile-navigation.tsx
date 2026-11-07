'use client';

import {
  BookOpenText,
  Sparkles,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  Ellipsis,
  SquareLibrary,
  Map,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

export type PdfMobileSection =
  | 'resumen'
  | 'tarjetas'
  | 'ejercicios'
  | 'progreso'
  | 'glosario'
  | 'mapa';

export function PdfMobileNavigation({
  active,
  onSelect,
  showProgress = true,
  hasPendingErrors = false,
}: {
  active: PdfMobileSection;
  onSelect: (section: PdfMobileSection) => void;
  showProgress?: boolean;
  hasPendingErrors?: boolean;
}) {
  const english = useOptionalAppLocale() === 'en';
  const items: Array<{ id: PdfMobileSection; label: string; icon: typeof BookOpenText }> = [
    { id: 'resumen', label: english ? 'Summary' : 'Resumen', icon: BookOpenText },
    { id: 'tarjetas', label: 'Flashcards', icon: Sparkles },
    { id: 'ejercicios', label: english ? 'Practice' : 'Práctica', icon: BrainCircuit },
    ...(showProgress
      ? [{ id: 'progreso' as const, label: english ? 'Progress' : 'Progreso', icon: ChartNoAxesColumnIncreasing }]
      : []),
  ];
  const itemClass = (selected: boolean) =>
    cn(
      'focus-visible:outline-ring flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2',
      selected ? 'bg-[#EEF2FF] text-[#2563EB] opacity-100' : 'text-[#42506A] hover:bg-[#F5F7FB]'
    );
  const moreActive = active === 'glosario' || active === 'mapa';

  return (
    <nav
      data-pdf-mobile-navigation
      aria-label={english ? 'Study tools for this document' : 'Herramientas de este PDF'}
      className="border-border bg-card fixed inset-x-0 bottom-0 z-40 border-t px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className={cn('grid gap-1', showProgress ? 'grid-cols-5' : 'grid-cols-4')}>
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            data-recommended-tab={id === 'ejercicios' ? id : undefined}
            onClick={() => onSelect(id)}
            aria-current={active === id ? 'page' : undefined}
            className={itemClass(active === id)}
          >
            <span className="relative">
              <Icon aria-hidden="true" className="size-5" />
              {id === 'progreso' && hasPendingErrors && (
                <span
                  className="bg-destructive absolute -top-0.5 -right-1 size-1.5 rounded-full"
                  aria-hidden="true"
                />
              )}
            </span>
            {label}
            {id === 'progreso' && hasPendingErrors && (
              <span className="sr-only">{english ? ': mistakes to review' : ': errores por resolver'}</span>
            )}
          </button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={
                moreActive
                  ? (english ? `More tools: ${active === 'mapa' ? 'Mind map' : 'Glossary'} selected` : `Más herramientas: ${active === 'mapa' ? 'Mapa mental' : 'Glosario'} seleccionado`)
                  : (english ? 'More tools' : 'Más herramientas')
              }
              className={itemClass(moreActive)}
            >
              <Ellipsis aria-hidden="true" className="size-5" /> {english ? 'More' : 'Más'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={10}
            className="border-border w-56 rounded-xl p-1.5"
          >
            <DropdownMenuItem
              onSelect={() => onSelect('glosario')}
              className={cn(
                'min-h-11 gap-2 rounded-lg text-[13px]',
                active === 'glosario' && 'bg-primary/10 text-blue-800 dark:text-blue-200'
              )}
            >
              <SquareLibrary aria-hidden="true" className="size-4" /> {english ? 'Glossary' : 'Glosario'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onSelect('mapa')}
              className={cn(
                'min-h-11 gap-2 rounded-lg text-[13px]',
                active === 'mapa' && 'bg-primary/10 text-blue-800 dark:text-blue-200'
              )}
            >
              <Map aria-hidden="true" className="size-4" /> {english ? 'Mind map' : 'Mapa mental'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
