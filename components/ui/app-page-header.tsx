import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppPageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'default' | 'compact';
  align?: 'left' | 'center';
  className?: string;
};

export function AppPageHeader({
  eyebrow,
  title,
  description,
  actions,
  as = 'h1',
  size = 'default',
  align = 'left',
  className,
}: AppPageHeaderProps) {
  const Heading = as;

  return (
    <header
      className={cn(
        'flex min-w-0 flex-col gap-4 border-b border-slate-200 pb-5 sm:pb-6',
        align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className={cn('min-w-0', align === 'center' && 'mx-auto max-w-2xl')}>
        {eyebrow ? (
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <Heading
          className={cn(
            'font-bold tracking-[-0.05em] text-slate-950',
            eyebrow && 'mt-1.5',
            size === 'compact'
              ? 'text-[1.35rem] sm:text-[1.55rem]'
              : 'text-[1.8rem] sm:text-[2.15rem] lg:text-[2.35rem]'
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p
            className={cn(
              'mt-2 max-w-2xl text-slate-500',
              size === 'compact' ? 'text-[13px] leading-5' : 'text-sm leading-6'
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            'flex shrink-0 flex-wrap items-center gap-2',
            align === 'center' && 'justify-center'
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
