import { Skeleton } from '@/components/ui/skeleton';

const SKELETON_BLOCK = 'bg-slate-200';

export default function StudentMaterialLoading() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="border-b border-[#E8EDF5] bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Skeleton className={`h-10 w-24 rounded-full ${SKELETON_BLOCK}`} />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <Skeleton className={`h-9 w-72 max-w-full rounded-xl ${SKELETON_BLOCK}`} />
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Skeleton className={`h-5 w-28 rounded-lg ${SKELETON_BLOCK}`} />
              <Skeleton className={`h-5 w-32 rounded-lg ${SKELETON_BLOCK}`} />
              <Skeleton className={`h-5 w-24 rounded-lg ${SKELETON_BLOCK}`} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="hidden xl:block">
          <div className="relative h-[calc(100vh-12rem)] min-h-[660px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-2.5 border-b border-slate-200 px-2.5 py-3 sm:px-4 sm:py-4">
                <div className="flex gap-1.5 overflow-x-auto">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className={`h-9 w-28 flex-none rounded-[14px] ${SKELETON_BLOCK}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Skeleton className={`h-9 w-32 rounded-[14px] ${SKELETON_BLOCK}`} />
                  <Skeleton className={`h-9 w-20 rounded-[14px] ${SKELETON_BLOCK}`} />
                </div>
              </div>

              <div className="flex min-h-0 flex-1">
                <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4">
                  <Skeleton className={`h-6 w-48 rounded-lg ${SKELETON_BLOCK}`} />
                  <Skeleton className={`mt-4 h-4 w-full rounded-lg ${SKELETON_BLOCK}`} />
                  <Skeleton className={`mt-2 h-4 w-5/6 rounded-lg ${SKELETON_BLOCK}`} />
                  <Skeleton className={`mt-2 h-4 w-2/3 rounded-lg ${SKELETON_BLOCK}`} />
                  <Skeleton className={`mt-8 h-6 w-40 rounded-lg ${SKELETON_BLOCK}`} />
                  <Skeleton className={`mt-4 h-4 w-full rounded-lg ${SKELETON_BLOCK}`} />
                  <Skeleton className={`mt-2 h-4 w-4/5 rounded-lg ${SKELETON_BLOCK}`} />
                  <Skeleton className={`mt-2 h-4 w-3/5 rounded-lg ${SKELETON_BLOCK}`} />
                </div>
                <div className="w-[40%] border-l border-slate-200 p-2">
                  <Skeleton className={`h-full w-full rounded-[22px] ${SKELETON_BLOCK}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:hidden">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_22px_54px_rgba(15,23,42,0.10)]">
            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 px-2.5 py-3 sm:px-4 sm:py-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className={`h-9 w-24 flex-none rounded-[14px] ${SKELETON_BLOCK}`}
                />
              ))}
            </div>
            <div className="px-4 py-4">
              <Skeleton className={`h-6 w-48 rounded-lg ${SKELETON_BLOCK}`} />
              <Skeleton className={`mt-4 h-4 w-full rounded-lg ${SKELETON_BLOCK}`} />
              <Skeleton className={`mt-2 h-4 w-5/6 rounded-lg ${SKELETON_BLOCK}`} />
              <Skeleton className={`mt-2 h-4 w-2/3 rounded-lg ${SKELETON_BLOCK}`} />
            </div>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_22px_54px_rgba(15,23,42,0.10)]">
            <Skeleton className={`h-[58vh] w-full rounded-[20px] ${SKELETON_BLOCK}`} />
          </div>
        </div>
      </section>
    </main>
  );
}
