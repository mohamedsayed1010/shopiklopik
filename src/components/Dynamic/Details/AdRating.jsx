import { useContext, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Trash2 } from "lucide-react";

import Panel from "./Panel";
import { AuthContext } from "../../../context/AuthContext";
import useAdvertisementRating, {
  useAdvertisementRatings,
} from "../../../hooks/useAdvertisementRating";
import { formatNumber, formatRelativeTime } from "../../../utils/format";

const STARS = [1, 2, 3, 4, 5];

/** A row of stars. Interactive when `onPick` is given, decorative otherwise. */
function Stars({ value = 0, size = 18, onPick, hovered = 0, onHover }) {
  return (
    <span className="flex items-center gap-0.5" dir="ltr">
      {STARS.map((star) => {
        const filled = star <= (hovered || value);

        const content = (
          <Star
            size={size}
            strokeWidth={2}
            className={
              filled ? "fill-gold-400 text-gold-500" : "fill-none text-line-strong"
            }
          />
        );

        if (!onPick) {
          return (
            <span key={star} aria-hidden="true">
              {content}
            </span>
          );
        }

        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} من 5`}
            onClick={() => onPick(star)}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(0)}
            className="cursor-pointer rounded-md p-0.5 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {content}
          </button>
        );
      })}
    </span>
  );
}

/** One bar of the five-star breakdown, as a share of the server's own total. */
function BreakdownRow({ star, count, total }) {
  /* A share of a total the server gave, not a statistic of its own — the width
     is presentation, and `count` is printed beside it verbatim. */
  const share = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5">
      <span className="tnum flex w-8 shrink-0 items-center justify-end gap-0.5 text-[12px] font-semibold text-muted">
        {star}
        <Star size={11} className="fill-gold-400 text-gold-500" />
      </span>

      <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-[width] duration-500 ease-out"
          style={{ width: `${share}%` }}
        />
      </span>

      <span className="tnum w-8 shrink-0 text-[12px] text-muted">
        {formatNumber(count ?? 0)}
      </span>
    </div>
  );
}

function ReviewRow({ review }) {
  const name = review?.reviewer?.name?.trim();

  return (
    <li className="flex items-start gap-3 py-3.5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700">
        {name ? name.charAt(0) : "؟"}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="truncate text-[13.5px] font-semibold text-ink">
            {name || "مستخدم"}
          </span>

          <Stars value={review.rating} size={13} />
        </div>

        <time className="tnum mt-0.5 block text-[11.5px] text-muted">
          {formatRelativeTime(review.updatedAt || review.createdAt)}
        </time>
      </div>
    </li>
  );
}

export default function AdRating({ id, type, categoryId, subCategoryId }) {
  const { token } = useContext(AuthContext);

  const [hovered, setHovered] = useState(0);

  const [pageIndex, setPageIndex] = useState(1);

  const {
    summary,
    isLoading,
    isError,
    submit,
    remove,
    isSubmitting,
    isRemoving,
    canRate,
    moduleType,
  } = useAdvertisementRating({ id, type, categoryId, subCategoryId });

  const ratingsCount = summary?.ratingsCount ?? 0;

  /* Only asked for once the summary says there is something to list, so an
     unrated ad costs one request instead of two. */
  const { items, page, isFetching } = useAdvertisementRatings({
    id,
    type: moduleType,
    pageIndex,
    pageSize: 5,
    enabled: ratingsCount > 0,
  });

  if (isLoading || isError || !id) return null;

  const average = summary?.averageRating;

  const breakdown = summary?.breakdown ?? {};

  const myRating = summary?.myRating;

  const busy = isSubmitting || isRemoving;

  return (
    <Panel title="التقييمات" icon={Star}>
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
        {/* The score, exactly as the server reports it. `null` means nobody has
            rated yet, which is not the same as zero and is not shown as one. */}
        <div className="flex flex-col items-center justify-center gap-1.5 sm:border-e sm:border-line/70 sm:pe-8">
          <span className="tnum text-4xl font-extrabold leading-none text-ink">
            {average === null || average === undefined
              ? "—"
              : formatNumber(average)}
          </span>

          <Stars value={Math.round(average ?? 0)} size={16} />

          <span className="tnum text-[12px] text-muted">
            {ratingsCount > 0
              ? `${formatNumber(ratingsCount)} تقييم`
              : "لا توجد تقييمات بعد"}
          </span>
        </div>

        <div className="space-y-1.5">
          {STARS.slice().reverse().map((star) => (
            <BreakdownRow
              key={star}
              star={star}
              count={breakdown?.[star] ?? breakdown?.[String(star)] ?? 0}
              total={ratingsCount}
            />
          ))}
        </div>
      </div>

      {/* This visitor's own rating: submit, change, or take back. */}
      {token && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-canvas/70 px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] font-semibold text-ink">
              {myRating ? "تقييمك" : "قيّم هذا الإعلان"}
            </span>

            <Stars
              value={myRating ?? 0}
              hovered={hovered}
              onHover={setHovered}
              onPick={(star) => {
                if (busy || !canRate) return;

                submit(star);
              }}
            />
          </div>

          {/* Only offered once there is a rating to remove — the server's
              `myRating`, never a local memory of having clicked. */}
          {myRating ? (
            <button
              type="button"
              onClick={() => remove()}
              disabled={busy}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-muted transition-colors duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
              حذف تقييمي
            </button>
          ) : null}
        </div>
      )}

      {/* The reviews themselves, paged by the server. */}
      {ratingsCount > 0 && (
        <div className="mt-5 border-t border-line/70 pt-1">
          <ul className="divide-y divide-line/70">
            {items.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </ul>

          {page?.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={() => setPageIndex((current) => current - 1)}
                disabled={!page.hasPrevious || isFetching}
                aria-label="السابق"
                className="cursor-pointer rounded-lg border border-line p-1.5 text-muted transition-colors duration-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>

              <span className="tnum text-[12px] text-muted">
                {formatNumber(page.pageIndex)} / {formatNumber(page.totalPages)}
              </span>

              <button
                type="button"
                onClick={() => setPageIndex((current) => current + 1)}
                disabled={!page.hasNext || isFetching}
                aria-label="التالي"
                className="cursor-pointer rounded-lg border border-line p-1.5 text-muted transition-colors duration-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
