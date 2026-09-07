import { Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Images, MapPin, Share2, Sparkles, Star } from "lucide-react";

import Image from "./Image";
import ViewsChip from "./ViewsChip";
import { supportsHoverPreview } from "./hoverPreview";

const QuickPreview = lazy(() => import("./QuickPreview"));

const ShareModal = lazy(() => import("./ShareModal"));
import useFavorite from "../../hooks/useFavorite";
import { useCardRating } from "../../hooks/useAdvertisementRating";
import { formatRelativeTime } from "../../utils/format";


/** Long enough that scanning across a grid does not fire previews. */
const PREVIEW_OPEN_DELAY = 520;

/** Short grace period so the pointer can travel card → panel. */
const PREVIEW_CLOSE_DELAY = 140;

const SIZES = {
  default: {
    ratio: "aspect-[4/3]",
    body: "p-4",
    price: "text-[19px] leading-7",
    title: "text-[15px] leading-6",
    description: "mt-1.5 line-clamp-2 text-[13px] leading-6",
  },
  compact: {
    ratio: "aspect-[4/3]",
    body: "p-3.5",
    price: "text-[17px] leading-6",
    title: "text-[14px] leading-6",
    description: "mt-1 line-clamp-1 text-[12.5px] leading-5",
  },
};

function Badges({ card }) {
  const photoCount = card.images?.length ?? 0;

  if (!card.isNew && photoCount <= 1 && !card.isExpired) return null;

  return (
    <div className="pointer-events-none absolute top-3 flex items-center gap-1.5 start-3">
      {card.isExpired ? (
        <span className="rounded-full bg-brand-950/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          منتهي
        </span>
      ) : (
        card.isNew && (
          <span className="flex items-center gap-1 rounded-full bg-gold-300 px-2.5 py-1 text-[11px] font-bold text-brand-900 shadow-sm">
            <Sparkles size={11} strokeWidth={2.6} />
            جديد
          </span>
        )
      )}

      {photoCount > 1 && (
        <span className="tnum flex items-center gap-1 rounded-full bg-brand-950/65 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Images size={11} strokeWidth={2.4} />
          {photoCount}
        </span>
      )}
    </div>
  );
}

function RatingChip({ rating }) {
  const count = rating?.count ?? null;

  const average = rating?.average ?? null;

  if (count === null) return null;

  if (count === 0 || average === null) {
    return (
      <span className="shrink-0 text-muted/80">لا يوجد تقييمات</span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1 font-medium text-ink-soft">
      <Star size={12} className="shrink-0 fill-gold-400 text-gold-500" />

      <span className="tnum">{average.toFixed(1)}</span>

      <span className="tnum text-muted">({count})</span>
    </span>
  );
}

/** Avatar falls back to initials on a stable hue derived from the name. */
function SellerRow({ seller }) {
  if (!seller?.name) return null;

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {seller.avatar ? (
        <img
          src={seller.avatar}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-line"
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            backgroundColor: `hsl(${seller.hue} 62% 92%)`,
            color: `hsl(${seller.hue} 55% 32%)`,
          }}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
        >
          {seller.initials}
        </span>
      )}

      <span className="truncate font-medium">{seller.name}</span>
    </span>
  );
}

function ListingCard({
  card,
  variant = "default",
  className = "",
  /* Rendered under the body, outside the link — the Lost & Found rail. */
  footer = null,
  priority = false,
}) {
  const size = SIZES[variant] ?? SIZES.default;

  /* The heart is the account's favourites list, not the device's. State and
     count both come back from the API; this component never computes either. */
  const {
    isFavorite: isSaved,
    toggle: toggleFavorite,
    isPending: isSaving,
  } = useFavorite({
    id: card?.id,
    type: card?.type,
    categoryId: card?.categoryId,
    subCategoryId: card?.subCategoryId,
    isFavorite: card?.isFavorite,
    favoriteCount: card?.stats?.favorites,
  });

  /* Costs no request: a disabled query that only subscribes to whatever the
     details page has already stored for this ad, falling back to the row. */
  const rating = useCardRating({
    id: card?.id,
    type: card?.type,
    categoryId: card?.categoryId,
    subCategoryId: card?.subCategoryId,
    fallback: card?.rating,
  });

  const [isShareOpen, setShareOpen] = useState(false);

  const [anchor, setAnchor] = useState(null);

  /* Latch each overlay on first use so the lazy component stays mounted and
     can animate itself closed. */
  const [previewMounted, setPreviewMounted] = useState(false);

  const [shareMounted, setShareMounted] = useState(false);

  if (anchor && !previewMounted) setPreviewMounted(true);

  if (isShareOpen && !shareMounted) setShareMounted(true);

  const openTimer = useRef(null);

  const closeTimer = useRef(null);

  const rootRef = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const scheduleOpen = useCallback(() => {
    // Touch and coarse pointers never get a preview; a tap must open the ad.
    if (!supportsHoverPreview()) return;

    clearTimers();

    openTimer.current = setTimeout(() => {
      const rect = rootRef.current?.getBoundingClientRect();

      if (rect) setAnchor(rect);
    }, PREVIEW_OPEN_DELAY);
  }, [clearTimers]);

  const scheduleClose = useCallback(() => {
    clearTimers();

    closeTimer.current = setTimeout(() => setAnchor(null), PREVIEW_CLOSE_DELAY);
  }, [clearTimers]);

  const closeNow = useCallback(() => {
    clearTimers();
    setAnchor(null);
  }, [clearTimers]);

  const handleSave = useCallback(
    (event) => {
      // The card is a link — keep the interaction on the control.
      event?.preventDefault();
      event?.stopPropagation();

      toggleFavorite();
    },
    [toggleFavorite]
  );

  const handleShare = useCallback(
    (event) => {
      event?.preventDefault();
      event?.stopPropagation();

      closeNow();
      setShareOpen(true);
    },
    [closeNow]
  );

  if (!card) return null;

  const shareUrl = card.href
    ? new URL(card.href, window.location.origin).href
    : window.location.href;

  /* Kept nullable on purpose: `null` means this module's list payload carries
     no view count, which the chip renders as a placeholder rather than as a
     zero nobody reported. */
  const views = card.stats?.views ?? null;

  const body = (
    <>
      <div className="relative">
        <Image
          src={card.images?.[0]}
          alt={card.hasTitle ? card.title : ""}
          ratio={size.ratio}
          priority={priority}
          imgClassName="transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
        >
          {/* Scrim keeps the overlaid chips legible on any photo. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent opacity-70"
          />
        </Image>

        <Badges card={card} />

        {/* Save and share ride the photo. Share only appears once there is a
            link worth sending. */}
        <div className="absolute top-3 flex flex-col gap-2 end-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            aria-pressed={isSaved}
            aria-busy={isSaving}
            aria-label={isSaved ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface/85 text-ink-soft shadow-sm backdrop-blur-sm transition-[transform,background-color,color,opacity] duration-200 ease-out hover:scale-110 hover:bg-surface hover:text-red-600 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            <Heart
              size={17}
              strokeWidth={2.1}
              className={`transition-transform duration-300 ${
                isSaved
                  ? "animate-heart-pop fill-red-500 text-red-500"
                  : "fill-transparent"
              }`}
            />
          </button>

          {card.href && (
            <button
              type="button"
              onClick={handleShare}
              aria-label="مشاركة الإعلان"
              className="flex h-9 w-9 translate-y-1 cursor-pointer items-center justify-center rounded-full bg-surface/85 text-ink-soft opacity-0 shadow-sm backdrop-blur-sm transition-[transform,opacity,background-color,color] duration-300 ease-out hover:bg-surface hover:text-brand-800 focus-visible:translate-y-0 focus-visible:opacity-100 active:scale-95 group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"
            >
              <Share2 size={16} strokeWidth={2.1} />
            </button>
          )}
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${size.body}`}>
        {card.price && (
          <p
            className={`tnum font-bold text-brand-900 ${size.price} flex items-baseline gap-1.5`}
          >
            {card.price.text}

            {card.price.negotiable && (
              <span className="text-[11px] font-semibold text-muted">
                قابل للتفاوض
              </span>
            )}
          </p>
        )}

        <h3
          className={`line-clamp-2 font-semibold text-ink transition-colors duration-200 group-hover:text-brand-700 ${
            size.title
          } ${card.price ? "mt-1" : ""}`}
        >
          {card.title}
        </h3>

        {card.description && (
          <p className={`${size.description} text-muted`}>{card.description}</p>
        )}

        {/* Always rendered: every card carries a views slot now, so the row is
            no longer conditional on the count existing. */}
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-3 text-xs text-muted">
            {card.location && (
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin size={13} className="shrink-0 text-brand-300" />
                <span className="truncate font-medium">{card.location}</span>
              </span>
            )}

            {card.location && card.createdAt && (
              <span aria-hidden="true" className="text-line-strong">
                •
              </span>
            )}

            {card.createdAt && (
              <span className="shrink-0">
                {card.timeText ?? formatRelativeTime(card.createdAt)}
              </span>
            )}

            <ViewsChip value={views} variant="meta" />

            {/* Last on the rail, so it never pushes the location or the date
                off a narrow card — the row wraps instead. */}
            <RatingChip rating={rating} />
          </div>

        {variant === "default" && card.seller?.name && (
          <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-muted">
            <SellerRow seller={card.seller} />
          </div>
        )}
      </div>
    </>
  );

  const shell =
    "group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs";

  const lift =
    "transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg";

  /* The preview and the share sheet are siblings of the card, never children
     of its link: a dialog nested inside an anchor is invalid markup and
     swallows clicks. */
  const overlays = (
    <>
      {previewMounted && (
        <Suspense fallback={null}>
          <QuickPreview
            card={card}
            anchor={anchor}
            isSaved={isSaved}
            onToggleSave={handleSave}
            onShare={handleShare}
            onPointerEnter={clearTimers}
            onPointerLeave={scheduleClose}
            onClose={closeNow}
          />
        </Suspense>
      )}

      {shareMounted && (
        <Suspense fallback={null}>
          <ShareModal
            open={isShareOpen}
            onClose={() => setShareOpen(false)}
            url={shareUrl}
            title={card.title}
          />
        </Suspense>
      )}
    </>
  );

  const hoverProps = card.href
    ? {
        onPointerEnter: scheduleOpen,
        onPointerLeave: scheduleClose,
        onPointerDown: closeNow,
      }
    : {};

  // With a footer rail the card can no longer *be* the link: the rail's
  // buttons would then be nested inside an anchor.
  if (footer) {
    return (
      <article
        ref={rootRef}
        {...hoverProps}
        className={`${shell} ${card.href ? lift : ""} ${className}`}
      >
        {card.href ? (
          <Link to={card.href} className="flex flex-1 flex-col">
            {body}
          </Link>
        ) : (
          <div className="flex flex-1 flex-col">{body}</div>
        )}

        {footer}

        {overlays}
      </article>
    );
  }

  if (!card.href) {
    return (
      <article ref={rootRef} className={`${shell} ${className}`}>
        {body}

        {overlays}
      </article>
    );
  }

  return (
    <>
      <Link
        ref={rootRef}
        to={card.href}
        {...hoverProps}
        className={`${shell} ${lift} ${className}`}
      >
        {body}
      </Link>

      {overlays}
    </>
  );
}

/* A feed refetch re-renders every card. The model is rebuilt each time, so
   compare on what actually changes the pixels. */
export default memo(ListingCard, (previous, next) => {
  const a = previous.card;
  const b = next.card;

  return (
    a?.id === b?.id &&
    a?.title === b?.title &&
    a?.price?.text === b?.price?.text &&
    a?.images?.[0] === b?.images?.[0] &&
    a?.stats?.views === b?.stats?.views &&
    a?.rating?.average === b?.rating?.average &&
    a?.rating?.count === b?.rating?.count &&
    previous.variant === next.variant &&
    previous.className === next.className &&
    previous.footer === next.footer &&
    previous.priority === next.priority
  );
});
