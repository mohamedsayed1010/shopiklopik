import { Image as ImageIcon, Megaphone } from "lucide-react";

import Image from "../../../../components/ui/Image";
import PanelCard from "./PanelCard";
import StatusBadge from "../../Ads/components/StatusBadge";
import { statusTone } from "../dashboardConstants";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";
import { formatDate, formatNumber, formatPrice } from "../../../../utils/format";

/** A money figure with its own currency, which the two payment DTOs carry. */
function money(amount, currency) {
  const value = formatNumber(Math.round(Number(amount) || 0));

  return currency ? `${value} ${currency}` : value;
}

function Tone({ status, label }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusTone(
        status
      )}`}
    >
      {label || status || "—"}
    </span>
  );
}

/* ------------------------------- ads ------------------------------- */

export function LatestAds({ ads, isLoading, onOpen }) {
  return (
    <PanelCard
      title="أحدث الإعلانات"
      icon={Megaphone}
      to="/admin/ads"
      isLoading={isLoading}
      isEmpty={!ads?.length}
      emptyText="لا توجد إعلانات حديثة."
    >
      <ul className="divide-y divide-line">
        {(ads ?? []).map((ad) => (
          <li key={`${ad.typeId}-${ad.id}`}>
            <button
              type="button"
              onClick={() => onOpen?.(ad)}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-canvas"
            >
              <Image
                src={resolveMediaUrl(ad.mainImageUrl)}
                alt=""
                ratio=""
                className="h-11 w-11 shrink-0 rounded-xl"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">
                  {ad.title || "بدون عنوان"}
                </p>

                <p className="mt-0.5 truncate text-[11.5px] text-muted">
                  {[ad.categoryName, ad.subCategoryName]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </p>

                <p className="mt-0.5 truncate text-[11.5px] text-muted">
                  {ad.ownerName || "—"} · {formatDate(ad.createdAt)}
                  {typeof ad.remainingDays === "number" && (
                    <span className="tnum"> · متبقٍ {ad.remainingDays} يوم</span>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="tnum text-[12.5px] font-bold text-brand-800">
                  {formatPrice(ad.price) ?? "—"}
                </span>

                <StatusBadge status={ad.status} size="sm" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

/* -------------------------- banner requests ------------------------- */

export function LatestBannerRequests({ requests, isLoading }) {
  return (
    <PanelCard
      title="أحدث طلبات البانر"
      icon={ImageIcon}
      /* No banner-management page exists in this app, so no "عرض الكل" link —
         a link is only added once there is somewhere for it to go. */
      isLoading={isLoading}
      isEmpty={!requests?.length}
      emptyText="لا توجد طلبات بانر حديثة."
      skeletonRows={3}
    >
      <ul className="divide-y divide-line">
        {(requests ?? []).map((request) => (
          <li key={request.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">
                  {request.title || "بدون عنوان"}
                </p>

                <p className="mt-0.5 truncate text-[11.5px] text-muted">
                  {request.advertiserName || "—"}
                </p>

                <p className="mt-0.5 truncate text-[11.5px] text-muted">
                  {request.locationName || "—"}
                  {typeof request.slotNumber === "number" && (
                    <span className="tnum"> · خانة {request.slotNumber}</span>
                  )}
                  {" · "}
                  {formatDate(request.submittedAt)}
                </p>
              </div>

              <span className="tnum shrink-0 text-[12.5px] font-bold text-brand-800">
                {money(request.price, request.currency)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tone status={request.status} label={request.statusName} />

              <Tone
                status={request.paymentStatus}
                label={request.paymentStatusName}
              />
            </div>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}
