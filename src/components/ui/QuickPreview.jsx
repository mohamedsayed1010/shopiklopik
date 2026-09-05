import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  LayoutGrid,
  MapPin,
  Share2,
} from "lucide-react";

import Image from "./Image";
import ViewsChip from "./ViewsChip";
import { formatDate } from "../../utils/format";


const WIDTH = 340;

const GAP = 14;

const MARGIN = 12;

export function supportsHoverPreview() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

function place(anchor, height) {
  const viewportWidth = window.innerWidth;

  const viewportHeight = window.innerHeight;

  const spaceAfter = viewportWidth - anchor.right;

  const spaceBefore = anchor.left;

  let left;

  if (spaceAfter >= WIDTH + GAP + MARGIN) {
    left = anchor.right + GAP;
  } else if (spaceBefore >= WIDTH + GAP + MARGIN) {
    left = anchor.left - WIDTH - GAP;
  } else {
    left = Math.min(
      Math.max(MARGIN, anchor.left + anchor.width / 2 - WIDTH / 2),
      viewportWidth - WIDTH - MARGIN
    );
  }

  // Centre on the card vertically, then keep the whole panel on screen.
  const preferredTop = anchor.top + anchor.height / 2 - height / 2;

  const top = Math.min(
    Math.max(MARGIN, preferredTop),
    Math.max(MARGIN, viewportHeight - height - MARGIN)
  );

  return { left, top };
}

function Fact({ icon: Icon, children }) {
  if (!children) return null;

  return (
    <li className="flex items-center gap-2 text-[12.5px] text-ink-soft">
      <Icon size={14} strokeWidth={2} className="shrink-0 text-brand-400" />
      <span className="min-w-0 truncate font-medium">{children}</span>
    </li>
  );
}

export default function QuickPreview({
  card,
  anchor,
  isSaved = false,
  onToggleSave,
  onShare,
  onPointerEnter,
  onPointerLeave,
  onClose,
}) {
  const panelRef = useRef(null);

  const [position, setPosition] = useState(null);

  // Measure first, paint second: placing the panel from a guessed height is
  // what makes previews jump on open.
  useLayoutEffect(() => {
    if (!anchor) return;

    const height = panelRef.current?.offsetHeight ?? 420;

    setPosition(place(anchor, height));
  }, [anchor]);

  // Any page movement invalidates the anchor rect we were handed.
  useEffect(() => {
    if (!anchor) return undefined;

    const dismiss = () => onClose?.();

    window.addEventListener("scroll", dismiss, { passive: true, capture: true });
    window.addEventListener("resize", dismiss);

    return () => {
      window.removeEventListener("scroll", dismiss, { capture: true });
      window.removeEventListener("resize", dismiss);
    };
  }, [anchor, onClose]);

  const views = card?.stats?.views ?? null;

  return createPortal(
    <AnimatePresence>
      {anchor && card && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={`معاينة سريعة: ${card.title}`}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: WIDTH,
            left: position?.left ?? -9999,
            top: position?.top ?? -9999,
            visibility: position ? "visible" : "hidden",
          }}
          className="glass fixed z-[80] overflow-hidden rounded-3xl border border-white/70 shadow-xl ring-1 ring-line/70"
        >
          <Image
            src={card.images?.[0]}
            alt={card.title}
            ratio="aspect-[16/10]"
            priority
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent"
            />

            {card.price && (
              <span className="tnum absolute bottom-3 rounded-full bg-surface/95 px-3 py-1.5 text-[14px] font-extrabold text-brand-900 shadow-md backdrop-blur-sm start-3">
                {card.price.text}
              </span>
            )}

            <ViewsChip value={views} variant="overlay" />
          </Image>

          <div className="p-4">
            <h3 className="line-clamp-2 text-[15px] font-bold leading-6 text-ink">
              {card.title}
            </h3>

            {card.description && (
              <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-6 text-muted">
                {card.description}
              </p>
            )}

            <ul className="mt-3 space-y-2 border-t border-line/70 pt-3">
              <Fact icon={MapPin}>{card.location}</Fact>

              <Fact icon={LayoutGrid}>
                {card.subCategory ?? card.category}
              </Fact>

              <Fact icon={CalendarDays}>{formatDate(card.createdAt)}</Fact>
            </ul>

            <div className="mt-4 flex items-center gap-2">
              {card.href && (
                <Link
                  to={card.href}
                  onClick={onClose}
                  className="group/cta flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-900 text-[13.5px] font-bold text-white shadow-xs transition-[background-color,box-shadow,transform] duration-300 ease-out hover:bg-brand-800 hover:shadow-md active:scale-[.97]"
                >
                  عرض التفاصيل
                  <ArrowLeft
                    size={15}
                    className="transition-transform duration-300 ease-out group-hover/cta:-translate-x-0.5"
                  />
                </Link>
              )}

              <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={isSaved}
                aria-label={isSaved ? "إزالة من المحفوظات" : "حفظ الإعلان"}
                className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-[background-color,border-color,color,transform] duration-300 ease-out active:scale-95 ${
                  isSaved
                    ? "border-brand-200 bg-brand-50 text-brand-800"
                    : "border-line-strong bg-surface text-ink-soft hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
                }`}
              >
                <Bookmark
                  size={16}
                  strokeWidth={2.1}
                  className={isSaved ? "fill-current" : ""}
                />
              </button>

              <button
                type="button"
                onClick={onShare}
                aria-label="مشاركة الإعلان"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-surface text-ink-soft transition-[background-color,border-color,color,transform] duration-300 ease-out hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 active:scale-95"
              >
                <Share2 size={16} strokeWidth={2.1} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
