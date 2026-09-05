import { Skeleton } from "../../../components/ui/Skeleton";

/** Mirrors the real layout so the page settles instead of jumping. */
export default function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
        <Skeleton className="h-40 w-full rounded-none sm:h-52" />

        <div className="flex flex-col items-center gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:px-8">
          <Skeleton className="-mt-16 h-[124px] w-[124px] shrink-0 rounded-full sm:-mt-20" />

          <div className="w-full flex-1 pt-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2.5 h-4 w-28" />
          </div>

          <Skeleton className="h-9 w-full rounded-lg sm:w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>

        <div className="space-y-6">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
