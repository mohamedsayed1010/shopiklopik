import { History, Trash2, X } from "lucide-react";

import ListingRail from "../../ui/ListingRail";
import ListingCard from "../../ui/ListingCard";
import useRecentlyViewed from "../../../hooks/useRecentlyViewed";

function RemoveButton({ onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`إزالة "${title}" من السجل`}
      title="إزالة من السجل"
      className="absolute top-3 z-30 flex h-8 w-8 translate-y-1 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink-soft opacity-0 shadow-sm backdrop-blur-sm transition-[transform,opacity,background-color,color] duration-300 ease-out hover:bg-surface hover:text-red-600 focus-visible:translate-y-0 focus-visible:opacity-100 active:scale-95 disabled:pointer-events-none disabled:opacity-40 group-hover/item:translate-y-0 group-hover/item:opacity-100 start-3 max-lg:translate-y-0 max-lg:opacity-100"
    >
      <X size={16} strokeWidth={2.4} />
    </button>
  );
}

export default function RecentlyViewed() {
  const { items, remove, removingId, clear, isClearing } = useRecentlyViewed();

  if (items.length === 0) return null;

  return (
    <ListingRail
      icon={History}
      title="شاهدت مؤخراً"
      action={
        <button
          type="button"
          onClick={clear}
          disabled={isClearing}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-muted transition-colors duration-300 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 size={14} strokeWidth={2.1} />

          <span className="max-sm:sr-only">
            {isClearing ? "جارٍ المسح…" : "مسح السجل"}
          </span>
        </button>
      }
    >
      {items.map((card) => (
        <div
          key={card.id}
          className="group/item relative w-[236px] shrink-0 snap-start sm:w-[256px]"
        >
          <RemoveButton
            onClick={() => remove(card.id, card.type)}
            disabled={removingId === card.id}
            title={card.title}
          />

          <ListingCard card={card} variant="compact" />
        </div>
      ))}
    </ListingRail>
  );
}
