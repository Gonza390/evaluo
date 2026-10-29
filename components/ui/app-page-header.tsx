import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppPageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  visuallyHiddenTitle?: boolean;
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
  visuallyHiddenTitle = false,
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
        'border-border flex min-w-0 flex-col gap-4 border-b pb-5 sm:pb-6',
        size === 'compact' && 'gap-3 pb-3 sm:pb-4',
        align === 'center'
          ? 'items-center text-center'
          : 'sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className={cn('min-w-0', align === 'center' && 'mx-auto max-w-2xl')}>
        {eyebrow ? (
          <p className="text-muted-foreground text-[10.5px] font-bold tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <Heading
          className={cn(
            'text-foreground font-bold tracking-[-0.05em] [overflow-wrap:anywhere]',
            visuallyHiddenTitle && 'sr-only',
            eyebrow && 'mt-1.5',
            size === 'compact'
              ? 'text-[20px] leading-[1.3] sm:text-[22px]'
              : 'text-[1.8rem] sm:text-[2.15rem] lg:text-[2.35rem]'
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p
            className={cn(
              'text-muted-foreground mt-2 max-w-2xl',
              size === 'compact' && 'mt-1.5',
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
