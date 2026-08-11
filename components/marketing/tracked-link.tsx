'use client';

import Link, { type LinkProps } from 'next/link';
import type { MouseEventHandler, ReactNode } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type TrackedLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  eventName: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function TrackedLink({
  children,
  className,
  eventName,
  payload,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      className={className}
      onClick={(event) => {
        trackMarketingEvent(eventName, payload);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
