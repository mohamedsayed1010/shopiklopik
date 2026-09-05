import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatNumber } from "../../utils/format";

export default function AdminPagination({
  result,
  pageIndex,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  itemNoun = "عنصر",
  onPageChange,
  onPageSizeChange,
}) {
  const totalCount = result?.totalCount ?? 0;

  const totalPages = result?.totalPages ?? 0;

  if (!totalCount) return null;

  const first = (pageIndex - 1) * pageSize + 1;

  const last = Math.min(pageIndex * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3 shadow-xs">
      <p className="tnum text-[13px] text-muted">
        عرض {formatNumber(first)}–{formatNumber(last)} من{" "}
        {formatNumber(totalCount)} {itemNoun}
      </p>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          لكل صفحة
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="tnum h-9 cursor-pointer rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink outline-none transition-colors hover:border-brand-300 focus:border-brand-500"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!result?.hasPrevious}
            aria-label="الصفحة السابقة"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight size={17} />
          </button>

          <span className="tnum min-w-[84px] text-center text-[13px] font-semibold text-ink">
            {formatNumber(pageIndex)} / {formatNumber(totalPages || 1)}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!result?.hasNext}
            aria-label="الصفحة التالية"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
