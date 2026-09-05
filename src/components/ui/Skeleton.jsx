
export function Skeleton({ className = "", style }) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`shimmer rounded-lg ${className}`}
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      <div className="p-4">
        <Skeleton className="h-5 w-28" />

        <Skeleton className="mt-2.5 h-4 w-4/5" />
        <Skeleton className="mt-2 h-4 w-3/5" />

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ListingRailSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`no-scrollbar flex gap-4 overflow-hidden ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-[248px] shrink-0 sm:w-[268px]">
          <ListingCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/** Search suggestions: an icon, a label and a trailing hint per row. */
export function SearchResultsSkeleton({ count = 5 }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="rounded-[20px] border border-line bg-surface p-4 shadow-xs sm:rounded-3xl sm:p-5">
      <Skeleton className="h-14 w-14 rounded-2xl sm:h-16 sm:w-16" />

      <Skeleton className="mt-4 h-4 w-4/5" />
      <Skeleton className="mt-2.5 h-3 w-1/2" />
    </div>
  );
}

export function CategoryGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <CategoryCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function SubCategoryGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5"
        >
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-3/5" />
          </div>

          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
