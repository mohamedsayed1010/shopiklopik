import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CalendarPlus,
  Eye,
  Hourglass,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";

import Image from "../../../components/ui/Image";
import Button from "../../../components/ui/Button";
import { describeStatus } from "../listingStatus";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import { listingEndpoint } from "../../../utils/listingEndpoint";
import { formatDate, formatPrice } from "../../../utils/format";

/** Arabic counts a day four different ways — "3 يوم" reads as broken copy. */
function formatDays(count) {
  if (count === 0) return "أقل من يوم";

  if (count === 1) return "يوم واحد";

  if (count === 2) return "يومان";

  if (count <= 10) return `${count} أيام`;

  return `${count} يومًا`;
}

function Meta({ icon: Icon, label, value, tone = "text-ink" }) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
        <Icon size={12} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        {label}
      </p>

      <p className={`mt-0.5 truncate text-[13px] font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export default function MyListingCard({
  listing,
  route,
  config,
  onDelete,
  onRepublish,
  isDeleting = false,
  isRepublishing = false,
}) {
  const status = describeStatus(listing.status);

  const categoryId = listing.categoryId ?? route?.categoryId;

  const subCategoryId = listing.subCategoryId ?? route?.subCategoryId;

  const detailsPath =
    categoryId && subCategoryId && listing.id
      ? `/dynamic/${categoryId}/${subCategoryId}/${listing.id}`
      : null;

  const endpoint = listingEndpoint({
    detailsEndpoint:
      config?.details?.endpoint ?? route?.config?.details?.endpoint,
    route: listing.route,
    id: listing.id,
  });

  const canUpdate = listing.canUpdate !== false;

  const canDelete = listing.canDelete !== false;

  const remaining =
    listing.remainingDays === null || listing.remainingDays === undefined
      ? Number.NaN
      : Number(listing.remainingDays);

  const hasRemaining = Number.isFinite(remaining) && !listing.isExpired;

  const urgent = hasRemaining && remaining <= 3;

  const price =
    listing.price === null || listing.price === undefined
      ? null
      : formatPrice(listing.price) ?? String(listing.price);

  /* The row's Arabic sub-category name reads as the section the user posted in
     ("مستلزمات الحمام"); the module enum ("BathroomSupply") never should. */
  const typeLabel =
    listing.subCategoryName ??
    listing.categoryName ??
    route?.subCategoryName ??
    route?.categoryName ??
    listing.type;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg sm:flex-row">
      {/* A definite height on the desktop rail is what lets the photo fill it;
          `h-full` against an auto-height flex item is not reliable. */}
      <div className="relative shrink-0 sm:h-44 sm:w-52">
        <Image
          src={resolveMediaUrl(listing.mainImageUrl)}
          alt={listing.title ?? ""}
          ratio="aspect-[16/10] sm:aspect-auto sm:h-full"
          imgClassName="transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
        />

        <span
          className={`absolute top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold shadow-sm ring-1 ring-inset start-3 ${status.className}`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
          />
          {status.label}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {typeLabel && (
              <p className="truncate text-[11.5px] font-semibold uppercase tracking-wide text-brand-400">
                {typeLabel}
              </p>
            )}

            <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-6 text-ink">
              {listing.title || "بدون عنوان"}
            </h3>
          </div>

          {price && (
            <p className="tnum shrink-0 text-[17px] font-bold leading-7 text-brand-900">
              {price}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3.5 sm:grid-cols-3">
          <Meta
            icon={CalendarPlus}
            label="تاريخ النشر"
            value={formatDate(listing.createdAt)}
          />

          <Meta
            icon={CalendarCheck}
            label="تاريخ البدء"
            value={formatDate(listing.startDate)}
          />

          <Meta
            icon={Hourglass}
            label="تاريخ الانتهاء"
            value={formatDate(listing.expireAt)}
          />

          {(hasRemaining || listing.isExpired) && (
            <Meta
              icon={Hourglass}
              label="المدة المتبقية"
              value={listing.isExpired ? "انتهت المدة" : formatDays(remaining)}
              tone={
                listing.isExpired
                  ? "text-red-600"
                  : urgent
                    ? "text-gold-700"
                    : "text-ink"
              }
            />
          )}
        </div>

        {(detailsPath || endpoint || listing.canRepublish) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {detailsPath && (
              <Button as={Link} to={detailsPath} size="sm" variant="outline">
                <Eye size={15} />
                عرض
              </Button>
            )}

            {/* Editing opens the same form the ad was published with, so it
                needs the route rather than the endpoint; the page re-checks
                ownership with the server before it renders anything. */}
            {detailsPath && canUpdate && (
              <Button
                as={Link}
                to={`${detailsPath}/edit`}
                size="sm"
                variant="outline"
              >
                <Pencil size={15} />
                تعديل
              </Button>
            )}

            {listing.canRepublish && endpoint && (
              <Button
                size="sm"
                variant="gold"
                loading={isRepublishing}
                onClick={() => onRepublish?.(listing, endpoint)}
              >
                {!isRepublishing && <RefreshCw size={15} />}
                إعادة النشر
              </Button>
            )}

            {endpoint && canDelete && (
              <Button
                size="sm"
                variant="danger-ghost"
                loading={isDeleting}
                onClick={() => onDelete?.(listing, endpoint)}
              >
                {!isDeleting && <Trash2 size={15} />}
                حذف
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
