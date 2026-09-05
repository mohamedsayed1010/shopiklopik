import { Loader2, Sparkles } from "lucide-react";

import ListingCard from "../../ui/ListingCard";
import ListingRail from "../../ui/ListingRail";
import { formatNumber } from "../../../utils/format";

/** The module the row belongs to, in the API's own words. */
function TypeChip({ card }) {
  const label = card.typeNameAr ?? card.typeName;

  if (!label) return null;

  return (
    <span className="pointer-events-none absolute top-3 z-20 max-w-[70%] truncate rounded-full bg-brand-950/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm start-3">
      {label}
    </span>
  );
}

export default function SimilarAds({
  items = [],
  isLoading = false,
  isError = false,
  totalCount = 0,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}) {
  if (isError) return null;

  if (!isLoading && items.length === 0) return null;

  return (
    <ListingRail
      variant="glass"
      icon={Sparkles}
      title="إعلانات مشابهة"
      isLoading={isLoading}
      action={
        totalCount > 0 && (
          <span className="tnum hidden shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-[12.5px] font-bold text-brand-700 sm:inline-block">
            {formatNumber(totalCount)} إعلان
          </span>
        )
      }
    >
      {items.map((card) => (
        <div
          key={card.key}
          className="relative w-[248px] shrink-0 snap-start sm:w-[268px]"
        >
          <TypeChip card={card} />

          <ListingCard card={card} variant="compact" />
        </div>
      ))}

      {/* Offered strictly on the server's `hasNext`. */}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="flex w-[132px] shrink-0 snap-start cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 text-[13px] font-bold text-brand-700 transition-[background-color,border-color,color] duration-300 hover:border-brand-200 hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-60"
        >
          {isLoadingMore ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} strokeWidth={2.1} />
          )}

          {isLoadingMore ? "جارٍ التحميل…" : "عرض المزيد"}
        </button>
      )}
    </ListingRail>
  );
}
