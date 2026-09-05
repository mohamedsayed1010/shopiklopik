import { ChevronLeft, ImageOff } from "lucide-react";

import BannerStatusBadge, { LiveBadge } from "./BannerStatusBadge";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";
import { formatMoney, formatDate, formatDateTime } from "../../../../utils/format";

/** The row thumbnail. Non-interactive — the row itself opens the request. */
function Thumb({ url, alt, className = "h-11 w-16" }) {
  const resolved = resolveMediaUrl(url);

  if (!resolved) {
    return (
      <span
        className={`flex ${className} shrink-0 items-center justify-center rounded-lg border border-dashed border-line-strong bg-canvas text-brand-300`}
      >
        <ImageOff size={14} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className={`block ${className} shrink-0 overflow-hidden rounded-lg border border-line bg-canvas`}
    >
      <img
        src={resolved}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </span>
  );
}

function Head({ children, className = "" }) {
  return (
    <th
      scope="col"
      className={`px-3 py-3 text-start text-[11.5px] font-bold uppercase tracking-wide text-muted ${className}`}
    >
      {children}
    </th>
  );
}

function Cell({ children, className = "" }) {
  return <td className={`px-3 py-3.5 align-middle ${className}`}>{children}</td>;
}

/** One field: a primary line with an optional quieter line beneath it. */
function Stacked({ primary, secondary }) {
  return (
    <>
      <span className="block truncate text-[12.5px] text-ink-soft">
        {primary || "—"}
      </span>

      {secondary && (
        <span className="mt-0.5 block truncate text-[11.5px] text-muted">
          {secondary}
        </span>
      )}
    </>
  );
}

/** "مساحة 2 · سيارات › ملاكي", with whichever halves the row actually has. */
function placementDetail(request) {
  const slot =
    request.slotNumber != null ? `مساحة ${request.slotNumber}` : null;

  const category = [request.categoryName, request.subCategoryName]
    .filter(Boolean)
    .join(" › ");

  return [slot, category || null].filter(Boolean).join(" · ");
}

export default function BannerRequestsTable({ requests, onOpen }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full table-fixed text-start">
          {/* Fixed proportions, so no column can widen the table past its
              container and no cell needs a scrollbar of its own. */}
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[17%]" />
            <col className="w-[19%]" />
            <col className="w-[4%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-line bg-canvas">
              <Head>البانر</Head>
              <Head>المساحة</Head>
              <Head>السعر</Head>
              <Head>الحالة</Head>
              <Head>الفترة</Head>
              <Head>
                <span className="sr-only">إجراءات</span>
              </Head>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {requests.map((request) => (
              <tr
                key={request.id}
                onClick={() => onOpen(request.id)}
                className="group/row cursor-pointer transition-colors duration-150 hover:bg-brand-50/60"
              >
                {/* Artwork, title and who sent it — the row's identity. */}
                <Cell>
                  <div className="flex items-center gap-3">
                    <Thumb
                      url={request.desktopImageUrl || request.mobileImageUrl}
                      alt={request.title || "بانر"}
                    />

                    <div className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 truncate text-[13px] font-semibold text-ink">
                          {request.title || "—"}
                        </span>

                        {request.isLive && <LiveBadge size="sm" />}
                      </span>

                      <span className="mt-0.5 block truncate text-[11.5px] text-muted">
                        {request.advertiserName || "—"}
                      </span>
                    </div>
                  </div>
                </Cell>

                {/* Placement, its slot, and the category it was booked for. */}
                <Cell>
                  <Stacked
                    primary={request.locationName}
                    secondary={placementDetail(request)}
                  />
                </Cell>

                <Cell>
                  <span className="tnum text-[13px] font-bold text-ink">
                    {formatMoney(request.price, request.currency)}
                  </span>
                </Cell>

                {/* Both states together: the request's and its payment's. */}
                <Cell>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <BannerStatusBadge
                      status={request.status}
                      statusName={request.statusName}
                      size="sm"
                    />

                    <BannerStatusBadge
                      status={request.paymentStatus}
                      statusName={request.paymentStatusName}
                      kind="payment"
                      size="sm"
                    />
                  </span>
                </Cell>

                {/* The window it was booked for, and when it arrived. */}
                <Cell>
                  <span className="tnum block truncate text-[11.5px] text-ink-soft">
                    {request.startDate ? formatDate(request.startDate) : "—"}
                    {" ← "}
                    {request.endDate ? formatDate(request.endDate) : "—"}
                  </span>

                  <span className="tnum mt-0.5 block truncate text-[11px] text-muted">
                    {formatDateTime(request.submittedAt)}
                  </span>
                </Cell>

                <Cell className="text-end">
                  <ChevronLeft
                    size={17}
                    aria-hidden="true"
                    className="inline text-line-strong transition-transform duration-200 group-hover/row:-translate-x-0.5"
                  />
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet */}
      <ul className="space-y-3 lg:hidden">
        {requests.map((request) => (
          <li key={request.id}>
            <button
              type="button"
              onClick={() => onOpen(request.id)}
              className="flex w-full cursor-pointer items-start gap-3.5 rounded-2xl border border-line bg-surface p-4 text-start shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <Thumb
                url={request.desktopImageUrl || request.mobileImageUrl}
                alt={request.title || "بانر"}
                className="h-14 w-20"
              />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[13.5px] font-bold text-ink">
                    {request.title || "—"}
                  </span>

                  {request.isLive && <LiveBadge size="sm" />}
                </span>

                <span className="mt-1 block truncate text-[12.5px] text-ink-soft">
                  {request.advertiserName || "—"}
                </span>

                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                  <span className="truncate">{request.locationName || "—"}</span>

                  {request.slotNumber != null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tnum">مساحة {request.slotNumber}</span>
                    </>
                  )}

                  <span aria-hidden="true">·</span>

                  <span className="tnum">
                    {formatMoney(request.price, request.currency)}
                  </span>
                </span>

                {(request.categoryName || request.subCategoryName) && (
                  <span className="mt-1 block truncate text-[11.5px] text-muted">
                    {[request.categoryName, request.subCategoryName]
                      .filter(Boolean)
                      .join(" › ")}
                  </span>
                )}

                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <BannerStatusBadge
                    status={request.status}
                    statusName={request.statusName}
                    size="sm"
                  />

                  <BannerStatusBadge
                    status={request.paymentStatus}
                    statusName={request.paymentStatusName}
                    kind="payment"
                    size="sm"
                  />
                </span>

                <span className="tnum mt-1.5 block text-[11px] text-muted">
                  {request.startDate ? formatDate(request.startDate) : "—"}
                  {" ← "}
                  {request.endDate ? formatDate(request.endDate) : "—"}
                </span>

                <span className="tnum mt-0.5 block text-[11px] text-muted">
                  {formatDateTime(request.submittedAt)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
