import { ChevronLeft, ImageIcon, ImageOff } from "lucide-react";

import AdPaymentStatusBadge from "./AdPaymentStatusBadge";
import { formatDateTime, formatMoney } from "../../../../utils/format";
import { hasScreenshot } from "../../../../utils/adPayment";

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

function Stacked({ primary, secondary, ltr = false }) {
  return (
    <>
      <span dir={ltr ? "ltr" : undefined} className="block truncate text-[12.5px] text-ink-soft">
        {primary || "—"}
      </span>

      {secondary && (
        <span className="mt-0.5 block truncate text-[11.5px] text-muted">{secondary}</span>
      )}
    </>
  );
}

const placement = (row) =>
  [row.categoryName, row.subCategoryName].filter(Boolean).join(" › ") || null;

const typeLabel = (row) =>
  row.advertisementTypeName ||
  (row.advertisementType != null ? `#${row.advertisementType}` : null);

function ScreenshotFlag({ row }) {
  return hasScreenshot(row) ? (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-700">
      <ImageIcon size={14} aria-hidden="true" />
      مرفق
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[12px] text-muted">
      <ImageOff size={14} aria-hidden="true" />
      لا يوجد
    </span>
  );
}

/* One row per submission. Every row opens the details, which re-read the
   record from `GET /submissions/{id}`; the list row is only the summary. */
export default function AdPaymentTable({ rows, onOpen, dateField = "submittedAt" }) {
  const dateLabel = dateField === "reviewedAt" ? "المراجعة" : "الإرسال";

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full table-fixed text-start">
          <colgroup>
            <col className="w-[27%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
            <col className="w-[15%]" />
            <col className="w-[16%]" />
            <col className="w-[8%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-line bg-canvas">
              <Head>الإعلان</Head>
              <Head>صاحب الإعلان</Head>
              <Head>المبلغ</Head>
              <Head>الحالة</Head>
              <Head>تاريخ {dateLabel}</Head>
              <Head>الإيصال</Head>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={row.paymentSubmissionId}
                onClick={() => onOpen(row.paymentSubmissionId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(row.paymentSubmissionId);
                  }
                }}
                tabIndex={0}
                aria-label={`تفاصيل طلب الدفع: ${row.advertisementTitle || row.paymentSubmissionId}`}
                className="cursor-pointer transition-colors duration-150 hover:bg-brand-50/60 focus-visible:bg-brand-50/60 focus-visible:outline-none"
              >
                <Cell>
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {row.advertisementTitle || "—"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted">
                    {[typeLabel(row), placement(row)].filter(Boolean).join(" · ") || "—"}
                  </span>
                </Cell>

                <Cell>
                  <Stacked primary={row.ownerName} secondary={row.ownerPhone} />
                </Cell>

                <Cell>
                  <span className="tnum block truncate text-[13px] font-semibold text-ink">
                    {formatMoney(row.amount, row.currency) ?? "—"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted">
                    {row.paymentMethodName || "—"}
                  </span>
                </Cell>

                <Cell>
                  <AdPaymentStatusBadge status={row.paymentStatus} statusName={row.paymentStatusName} />
                </Cell>

                <Cell>
                  <Stacked primary={formatDateTime(row[dateField]) || null} />
                </Cell>

                <Cell>
                  <span className="flex items-center justify-between gap-1">
                    <ScreenshotFlag row={row} />
                    <ChevronLeft size={16} aria-hidden="true" className="shrink-0 text-muted" />
                  </span>
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile and tablet */}
      <ul className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <li key={row.paymentSubmissionId}>
            <button
              type="button"
              onClick={() => onOpen(row.paymentSubmissionId)}
              className="block w-full cursor-pointer rounded-2xl border border-line bg-surface p-4 text-start shadow-xs transition-colors duration-150 hover:border-brand-200"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-ink">
                    {row.advertisementTitle || "—"}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted">
                    {[typeLabel(row), placement(row)].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>

                <AdPaymentStatusBadge status={row.paymentStatus} statusName={row.paymentStatusName} />
              </span>

              <span className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-[12px]">
                <span className="min-w-0">
                  <span className="block text-muted">المبلغ</span>
                  <span className="tnum block truncate font-semibold text-ink">
                    {formatMoney(row.amount, row.currency) ?? "—"}
                  </span>
                </span>

                <span className="min-w-0">
                  <span className="block text-muted">صاحب الإعلان</span>
                  <span className="block truncate text-ink-soft">{row.ownerName || "—"}</span>
                </span>

                <span className="min-w-0">
                  <span className="block text-muted">تاريخ {dateLabel}</span>
                  <span className="block truncate text-ink-soft">{formatDateTime(row[dateField]) || "—"}</span>
                </span>

                <span className="min-w-0">
                  <span className="block text-muted">الإيصال</span>
                  <ScreenshotFlag row={row} />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
