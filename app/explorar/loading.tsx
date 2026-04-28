'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function ExplorarLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
