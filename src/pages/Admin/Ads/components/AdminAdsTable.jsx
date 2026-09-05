import { User } from "lucide-react";

import Image from "../../../../components/ui/Image";
import StatusBadge from "./StatusBadge";
import AdminAdRowActions from "./AdminAdRowActions";
import { formatDate, formatPrice } from "../../../../utils/format";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";

const HEADERS = [
  "الإعلان",
  "النوع",
  "القسم",
  "المالك",
  "السعر",
  "الحالة",
  "المراجعة",
  "أُنشئ",
  "يبدأ",
  "ينتهي",
  "المتبقي",
  "إجراءات",
];

/** "—" beats an empty cell: it says "nothing here", not "still loading". */
function Cell({ children }) {
  return <span className="text-[13px] text-ink-soft">{children || "—"}</span>;
}

function remainingLabel(days) {
  if (typeof days !== "number") return null;

  if (days <= 0) return "منتهي";

  return `${days} يوم`;
}

function Thumb({ ad, size = "h-12 w-12" }) {
  return (
    <Image
      src={resolveMediaUrl(ad.mainImageUrl)}
      alt=""
      ratio=""
      className={`${size} shrink-0 rounded-xl`}
    />
  );
}

export default function AdminAdsTable({ ads, onDetails, onAction, disabled }) {
  return (
    <>
      {/* ---------- phones and tablets ---------- */}
      <ul className="space-y-3 lg:hidden">
        {ads.map((ad) => (
          <li
            key={`${ad.typeId}-${ad.id}`}
            className="rounded-2xl border border-line bg-surface p-3.5 shadow-xs"
          >
            <div className="flex gap-3">
              <Thumb ad={ad} size="h-16 w-16" />

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[14.5px] font-bold leading-6 text-ink">
                  {ad.title || "بدون عنوان"}
                </h3>

                <p className="mt-1 truncate text-xs text-muted">
                  {[ad.categoryName, ad.subCategoryName]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </p>

                <p className="tnum mt-1.5 text-sm font-bold text-brand-800">
                  {formatPrice(ad.price) ?? "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={ad.status} size="sm" />

              <StatusBadge
                status={ad.moderation?.status}
                label={ad.moderation?.statusName}
                size="sm"
              />

              {remainingLabel(ad.remainingDays) && (
                <span className="tnum rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-line">
                  {remainingLabel(ad.remainingDays)}
                </span>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-[12.5px]">
              <div className="min-w-0">
                <dt className="text-muted">المالك</dt>
                <dd className="truncate font-medium text-ink-soft">
                  {ad.ownerName || "—"}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-muted">النوع</dt>
                <dd className="truncate font-medium text-ink-soft">
                  {ad.type || "—"}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-muted">أُنشئ</dt>
                <dd className="truncate font-medium text-ink-soft">
                  {formatDate(ad.createdAt) || "—"}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-muted">ينتهي</dt>
                <dd className="truncate font-medium text-ink-soft">
                  {formatDate(ad.endDate) || "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex justify-end border-t border-line pt-3">
              <AdminAdRowActions
                ad={ad}
                onDetails={onDetails}
                onAction={onAction}
                disabled={disabled}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* ---------- desktop ---------- */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full min-w-[1100px] border-collapse text-start">
          <thead>
            <tr className="border-b border-line bg-canvas">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3 text-start text-[12px] font-bold uppercase tracking-wide text-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {ads.map((ad) => (
              <tr
                key={`${ad.typeId}-${ad.id}`}
                className="transition-colors duration-150 hover:bg-canvas"
              >
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Thumb ad={ad} />

                    <button
                      type="button"
                      onClick={() => onDetails(ad)}
                      className="min-w-0 cursor-pointer text-start"
                    >
                      <span className="line-clamp-2 max-w-[220px] text-[13.5px] font-semibold leading-5 text-ink hover:text-brand-700">
                        {ad.title || "بدون عنوان"}
                      </span>
                    </button>
                  </div>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <Cell>{ad.type}</Cell>
                </td>

                <td className="px-3 py-3">
                  <span className="block max-w-[150px] truncate text-[13px] text-ink-soft">
                    {ad.categoryName || "—"}
                  </span>
                  <span className="block max-w-[150px] truncate text-[11.5px] text-muted">
                    {ad.subCategoryName || "—"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                      <User size={14} aria-hidden="true" />
                    </span>

                    <span className="min-w-0">
                      <span className="block max-w-[130px] truncate text-[13px] font-medium text-ink-soft">
                        {ad.ownerName || "—"}
                      </span>
                      <span
                        dir="ltr"
                        className="tnum block max-w-[130px] truncate text-[11.5px] text-muted"
                      >
                        {ad.ownerPhone || ""}
                      </span>
                    </span>
                  </div>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[13px] font-bold text-brand-800">
                    {formatPrice(ad.price) ?? "—"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <StatusBadge status={ad.status} size="sm" />
                </td>

                <td className="px-3 py-3">
                  <StatusBadge
                    status={ad.moderation?.status}
                    label={ad.moderation?.statusName}
                    size="sm"
                  />
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <Cell>{formatDate(ad.createdAt)}</Cell>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <Cell>{formatDate(ad.startDate)}</Cell>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <Cell>{formatDate(ad.endDate)}</Cell>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[13px] text-ink-soft">
                    {remainingLabel(ad.remainingDays) ?? "—"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <AdminAdRowActions
                    ad={ad}
                    onDetails={onDetails}
                    onAction={onAction}
                    disabled={disabled}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
