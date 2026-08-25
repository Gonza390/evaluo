import { Fragment } from 'react';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { cn } from '@/lib/utils';

export type SeoBreadcrumbItem = {
  name: string;
  path: string;
};

type SeoBreadcrumbsProps = {
  items: SeoBreadcrumbItem[];
  className?: string;
  structuredData?: boolean;
};

export function SeoBreadcrumbs({
  items,
  className,
  structuredData = true,
}: SeoBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <>
      {structuredData ? <JsonLd data={buildBreadcrumbJsonLd(items)} /> : null}
      <div className={cn('mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8', className)}>
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => {
              const isCurrent = index === items.length - 1;

              return (
                <Fragment key={`${item.path}-${item.name}`}>
                  <BreadcrumbItem>
                    {isCurrent ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.path}>{item.name}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {isCurrent ? null : <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </>
  );
}
