import { Link } from "react-router-dom";
import { ChevronLeft, Layers } from "lucide-react";

import { formatNumber } from "../../../utils/format";

function shareOf(part, whole) {
  const value = Number(part);
  const total = Number(whole);

  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function TypeCard({ entry, route }) {
  const label = route?.subCategoryName ?? route?.categoryName ?? entry.type;

  const active = Number(entry.active) || 0;

  const total = Number(entry.total) || 0;

  const share = shareOf(active, total);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-ink">{label}</p>

          <p className="mt-0.5 text-[12.5px] text-muted">
            {formatNumber(total)} إعلان
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-inset ring-brand-100 transition-transform duration-300 group-hover:scale-110">
          <Layers size={16} strokeWidth={1.9} aria-hidden="true" />
        </span>
      </div>

      {/* Share of this module that is still live — the one comparison that
          matters when you are looking at your own portfolio. */}
      <div className="mt-4">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-brand-100"
          role="presentation"
        >
          <span
            className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-[width] duration-700 ease-out"
            style={{ width: `${share}%` }}
          />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium">
          <span className="text-green-700">{formatNumber(active)} نشط</span>

          {Number(entry.pending) > 0 && (
            <span className="text-gold-700">
              {formatNumber(entry.pending)} قيد المراجعة
            </span>
          )}

          {Number(entry.expired) > 0 && (
            <span className="text-muted">
              {formatNumber(entry.expired)} منتهي
            </span>
          )}

          {Number(entry.rejected) > 0 && (
            <span className="text-red-600">
              {formatNumber(entry.rejected)} مرفوض
            </span>
          )}
        </div>
      </div>
    </>
  );

  const base =
    "group relative flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-xs";

  if (!route?.categoryId || !route?.subCategoryId) {
    return <article className={base}>{body}</article>;
  }

  return (
    <Link
      to={`/dynamic/${route.categoryId}/${route.subCategoryId}`}
      className={`${base} transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg`}
    >
      {body}

      <ChevronLeft
        size={16}
        aria-hidden="true"
        className="absolute bottom-4 text-line-strong opacity-0 transition-opacity duration-200 group-hover:opacity-100 end-4"
      />
    </Link>
  );
}

export default function TypeBreakdown({ byType, resolve }) {
  const entries = (Array.isArray(byType) ? byType : []).filter(
    (entry) => entry && Number(entry.total) > 0
  );

  if (entries.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold text-ink">إعلاناتك حسب القسم</h2>

        <span className="text-[13px] text-muted">{entries.length} قسم</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {entries.map((entry) => (
          <TypeCard
            key={entry.type}
            entry={entry}
            route={resolve?.(entry.type) ?? null}
          />
        ))}
      </div>
    </section>
  );
}
