import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="w-64 border-r border-slate-200 bg-white/90">
        <Skeleton className="m-4 h-16 rounded-2xl" />
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-xl" />
          ))}
        </div>
      </div>
      <main className="mx-auto max-w-[1600px] flex-1 p-12">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-16 w-96 rounded-2xl" />
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
        <Skeleton className="mb-8 h-80 rounded-3xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
