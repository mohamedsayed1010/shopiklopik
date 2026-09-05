import { Skeleton } from "../../ui/Skeleton";

export default function DetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
      <div className="space-y-5 lg:col-span-8">
        <Skeleton className="aspect-video w-full rounded-[28px]" />

        <div className="flex gap-2.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-[76px] rounded-2xl" />
          ))}
        </div>

        <div className="rounded-[26px] border border-line bg-surface p-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <Skeleton className="mt-4 h-8 w-4/5" />

          <div className="mt-5 flex gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-32 w-full rounded-[26px]" />

        <div className="rounded-[26px] border border-line bg-surface p-6">
          <Skeleton className="h-5 w-32" />

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[74px] w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden space-y-5 lg:col-span-4 lg:block">
        <Skeleton className="h-72 w-full rounded-[26px]" />
        <Skeleton className="h-48 w-full rounded-[26px]" />
      </div>
    </div>
  );
}
