import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ListingRailSkeleton } from "./Skeleton";

function ScrollButton({ side, onClick, disabled }) {
  const Icon = side === "start" ? ChevronRight : ChevronLeft;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "start" ? "السابق" : "التالي"}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-xs transition-[background-color,border-color,color,transform,opacity] duration-300 ease-out hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 active:scale-90 disabled:pointer-events-none disabled:opacity-35"
    >
      <Icon size={16} strokeWidth={2.3} />
    </button>
  );
}

export default function ListingRail({
  icon: Icon,
  title,
  subtitle = null,
  action,
  variant = "surface",
  isLoading = false,
  skeletonCount = 4,
  children,
  className = "",
}) {
  const trackRef = useRef(null);

  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    // Absolute values: RTL browsers report a negative scrollLeft.
    const offset = Math.abs(track.scrollLeft);

    const max = track.scrollWidth - track.clientWidth;

    setEdges({ start: offset <= 4, end: offset >= max - 4 });
  }, []);

  useEffect(() => {
    measure();

    const track = trackRef.current;

    if (!track) return undefined;

    const observer = new ResizeObserver(measure);

    observer.observe(track);

    return () => observer.disconnect();
  }, [measure, children]);

  const scrollBy = (direction) => {
    const track = trackRef.current;

    if (!track) return;

    const step = Math.max(track.clientWidth * 0.8, 240);

    // `direction` is in reading order; the sign flips under RTL.
    const sign = document.dir === "rtl" ? -1 : 1;

    track.scrollBy({ left: step * direction * sign, behavior: "smooth" });
  };

  const isGlass = variant === "glass";

  return (
    <section
      className={`relative overflow-hidden ${
        isGlass
          ? "glass rounded-[26px] border border-white/70 shadow-md ring-1 ring-line/70"
          : "rounded-3xl border border-line bg-surface shadow-xs"
      } ${className}`}
    >
      {isGlass && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        />
      )}

      <header
        className={`flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-7 sm:py-5 ${
          isGlass ? "border-line/70" : "border-line"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <Icon size={17} strokeWidth={2.1} />
            </span>
          )}

          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-bold text-ink sm:text-base">
              {title}
            </h2>

            {/* Optional second line. Existing rails pass no subtitle and are
                unchanged — the heading keeps its size and position, and this
                simply does not render. */}
            {subtitle && (
              <p className="mt-0.5 truncate text-[11.5px] text-muted sm:text-xs">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {action}

          {/* Pointer-only: a touch device scrolls the rail directly. */}
          {/* Underscores are how an arbitrary variant spells a space; without
              them the query compiles to `(hover:hover)and(pointer:fine)`,
              which no browser accepts — so the buttons never appeared. */}
          <div className="hidden items-center gap-1.5 [@media(hover:hover)_and_(pointer:fine)]:flex">
            <ScrollButton
              side="start"
              disabled={edges.start}
              onClick={() => scrollBy(-1)}
            />

            <ScrollButton
              side="end"
              disabled={edges.end}
              onClick={() => scrollBy(1)}
            />
          </div>
        </div>
      </header>

      {isLoading ? (
        <ListingRailSkeleton
          count={skeletonCount}
          className="px-5 py-5 sm:px-7 sm:py-6"
        />
      ) : (
        <div
          ref={trackRef}
          onScroll={measure}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-5 sm:px-7 sm:py-6"
        >
          {children}
        </div>
      )}
    </section>
  );
}
