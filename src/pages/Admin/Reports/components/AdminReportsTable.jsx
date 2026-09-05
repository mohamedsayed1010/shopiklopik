import { CircleDot, Eye, Gavel, ShieldOff, User } from "lucide-react";

import {
  isOpenStatus,
  reasonTone,
  reportStatusTone,
} from "../reportsConstants";
import { formatDate, formatRelativeTime } from "../../../../utils/format";

const HEADERS = [
  "",
  "الإعلان المُبلَّغ عنه",
  "السبب",
  "المُبلِّغ",
  "الحالة",
  "تاريخ البلاغ",
  "المراجعة",
  "إجراءات",
];

function StatusBadge({ report, size = "md" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${reportStatusTone(
        report.statusName
      )} ${size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[11.5px]"}`}
    >
      {report.statusName || "—"}
    </span>
  );
}

function OpenDot({ report }) {
  if (!isOpenStatus(report.statusName)) return null;

  return (
    <CircleDot
      size={14}
      aria-label="بلاغ يحتاج مراجعة"
      className="shrink-0 text-gold-600"
    />
  );
}

function RowActions({ report, onOpen, onIgnore, onAction, disabled }) {
  const open = isOpenStatus(report.statusName);

  const base =
    "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();

          onOpen(report);
        }}
        disabled={disabled}
        title="التفاصيل"
        aria-label={`عرض تفاصيل بلاغ ${report.listingTitle ?? ""}`}
        className={`${base} text-brand-600 hover:bg-brand-50 hover:text-brand-900`}
      >
        <Eye size={16} />
      </button>

      {/* Decisions are only offered while the report is still open — a report
          already closed has nothing left to decide. */}
      {open && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              onIgnore(report);
            }}
            disabled={disabled}
            title="تجاهل البلاغ"
            aria-label={`تجاهل بلاغ ${report.listingTitle ?? ""}`}
            className={`${base} text-muted hover:bg-canvas hover:text-ink`}
          >
            <ShieldOff size={16} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              onAction(report);
            }}
            disabled={disabled}
            title="اتخاذ إجراء"
            aria-label={`اتخاذ إجراء على بلاغ ${report.listingTitle ?? ""}`}
            className={`${base} text-red-600 hover:bg-red-50`}
          >
            <Gavel size={16} />
          </button>
        </>
      )}
    </div>
  );
}

export default function AdminReportsTable({
  reports,
  onOpen,
  onIgnore,
  onAction,
  disabled,
}) {
  return (
    <>
      {/* ---------- phones and tablets ---------- */}
      <ul className="space-y-3 lg:hidden">
        {reports.map((report) => (
          <li
            key={report.id}
            className={`rounded-2xl border bg-surface p-3.5 shadow-xs ${
              isOpenStatus(report.statusName)
                ? "border-gold-200 ring-1 ring-gold-100"
                : "border-line"
            }`}
          >
            <button
              type="button"
              onClick={() => onOpen(report)}
              className="w-full cursor-pointer text-start"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <OpenDot report={report} />

                  <span className="truncate text-[14px] font-bold text-ink">
                    {report.listingTitle || "إعلان محذوف"}
                  </span>
                </span>

                <StatusBadge report={report} size="sm" />
              </div>

              <p className="mt-1 truncate text-[11.5px] text-muted">
                {report.listingTypeName || "—"}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${reasonTone(
                    report.reasonName
                  )}`}
                >
                  {report.reasonName || "—"}
                </span>
              </div>

              {report.details && (
                <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-ink-soft">
                  {report.details}
                </p>
              )}

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-[12px]">
                <div className="min-w-0">
                  <dt className="text-muted">المُبلِّغ</dt>
                  <dd className="truncate font-medium text-ink-soft">
                    {report.reporterName || "—"}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-muted">تاريخ البلاغ</dt>
                  <dd className="truncate font-medium text-ink-soft">
                    {formatDate(report.createdAt) || "—"}
                  </dd>
                </div>
              </dl>
            </button>

            <div className="mt-3 flex justify-end border-t border-line pt-3">
              <RowActions
                report={report}
                onOpen={onOpen}
                onIgnore={onIgnore}
                onAction={onAction}
                disabled={disabled}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* ---------- desktop ---------- */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full min-w-[1000px] border-collapse text-start">
          <thead>
            <tr className="border-b border-line bg-canvas">
              {HEADERS.map((header, index) => (
                <th
                  key={header || `spacer-${index}`}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3 text-start text-[12px] font-bold uppercase tracking-wide text-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {reports.map((report) => (
              <tr
                key={report.id}
                onClick={() => onOpen(report)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;

                  event.preventDefault();

                  onOpen(report);
                }}
                className={`cursor-pointer transition-colors duration-150 focus-visible:outline-none ${
                  isOpenStatus(report.statusName)
                    ? "bg-gold-50/40 hover:bg-gold-50/70"
                    : "hover:bg-canvas"
                }`}
              >
                <td className="w-6 px-3 py-3">
                  <OpenDot report={report} />
                </td>

                <td className="px-3 py-3">
                  <p className="max-w-[240px] truncate text-[13.5px] font-semibold text-ink">
                    {report.listingTitle || "إعلان محذوف"}
                  </p>

                  <p className="max-w-[240px] truncate text-[11.5px] text-muted">
                    {report.listingTypeName || "—"}
                  </p>
                </td>

                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${reasonTone(
                      report.reasonName
                    )}`}
                  >
                    {report.reasonName || "—"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                      <User size={13} aria-hidden="true" />
                    </span>

                    <span className="max-w-[130px] truncate text-[12.5px] text-ink-soft">
                      {report.reporterName || "—"}
                    </span>
                  </span>
                </td>

                <td className="px-3 py-3">
                  <StatusBadge report={report} />
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span
                    className="tnum text-[12.5px] text-muted"
                    title={report.createdAt || undefined}
                  >
                    {formatRelativeTime(report.createdAt) ||
                      formatDate(report.createdAt)}
                  </span>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[12.5px] text-muted">
                    {report.reviewedAt ? formatDate(report.reviewedAt) : "—"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <RowActions
                    report={report}
                    onOpen={onOpen}
                    onIgnore={onIgnore}
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
