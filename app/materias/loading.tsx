import { Skeleton } from '@/components/ui/skeleton';

export default function MateriasLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 space-y-4">
        <Skeleton className="h-12 w-40 rounded-xl" />
        <Skeleton className="h-10 w-80 max-w-md rounded-3xl" />
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[360px] rounded-[3rem]" />
        ))}
      </div>
    </div>
  );
}
