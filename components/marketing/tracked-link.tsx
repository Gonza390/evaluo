'use client';

import Link, { type LinkProps } from 'next/link';
import { useSyncExternalStore, type MouseEventHandler, type ReactNode } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { mergeAttributionFromSearch } from '@/lib/preguntero-attribution';

type TrackedLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  eventName: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /**
   * Suma al link los utm_* / ref_user de la URL actual al hidratar. Permite que
   * la página no lea `searchParams` en el servidor y quede cacheada (ISR).
   */
  preserveAttribution?: boolean;
};

function subscribeToNothing() {
  return () => {};
}

function useAttributedHref(href: LinkProps['href'], enabled: boolean): LinkProps['href'] {
  return useSyncExternalStore(
    subscribeToNothing,
    () =>
      enabled && typeof href === 'string'
        ? mergeAttributionFromSearch(href, window.location.search)
        : href,
    () => href
  );
}

export function TrackedLink({
  children,
  className,
  eventName,
  payload,
  onClick,
  preserveAttribution = false,
  href,
  ...props
}: TrackedLinkProps) {
  const resolvedHref = useAttributedHref(href, preserveAttribution);
  return (
    <Link
      {...props}
      href={resolvedHref}
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
