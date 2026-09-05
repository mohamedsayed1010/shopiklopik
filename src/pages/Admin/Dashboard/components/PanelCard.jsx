import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import Skeleton from "../../../../components/ui/Skeleton";

export default function PanelCard({
  title,
  icon: Icon,
  to,
  toLabel = "عرض الكل",
  isLoading,
  isEmpty,
  emptyText,
  skeletonRows = 4,
  children,
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-line bg-surface shadow-xs">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="flex min-w-0 items-center gap-2 text-[14.5px] font-bold text-ink">
          {Icon && (
            <Icon
              size={16}
              strokeWidth={2.1}
              aria-hidden="true"
              className="shrink-0 text-brand-500"
            />
          )}
          <span className="truncate">{title}</span>
        </h2>

        {to && (
          <Link
            to={to}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
          >
            {toLabel}
            <ChevronLeft size={14} aria-hidden="true" />
          </Link>
        )}
      </header>

      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: skeletonRows }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <p className="px-4 py-10 text-center text-[13px] text-muted">
            {emptyText}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
