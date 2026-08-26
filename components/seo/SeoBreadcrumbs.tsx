import Link from 'next/link';

type SeoBreadcrumbItem = {
  name: string;
  href?: string;
};

export function SeoBreadcrumbs({ items }: { items: SeoBreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Migas de pan" className="text-muted-foreground text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.name}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="truncate">
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
