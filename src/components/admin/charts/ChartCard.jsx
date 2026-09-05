import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";

import Skeleton from "../../ui/Skeleton";
import { CHART_COLORS } from "../../../pages/Admin/Dashboard/dashboardConstants";

export default function ChartCard({
  title,
  subtitle,
  series = [],
  isLoading,
  isEmpty,
  emptyText = "لا توجد بيانات في هذه المدة.",
  tableHead,
  tableRows,
  children,
  className = "",
}) {
  const [showTable, setShowTable] = useState(false);

  const hasLegend = series.length >= 2;

  return (
    <section
      className={`flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5 ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-ink">{title}</h3>

          {subtitle && (
            <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasLegend && (
            <ul className="flex flex-wrap items-center gap-3">
              {series.map((entry) => (
                <li
                  key={entry.key}
                  className="flex items-center gap-1.5 text-[12px] text-ink-soft"
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.label}
                </li>
              ))}
            </ul>
          )}

          {tableRows?.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTable((open) => !open)}
              aria-pressed={showTable}
              title={showTable ? "عرض الرسم البياني" : "عرض الجدول"}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-brand-50 hover:text-brand-900"
            >
              {showTable ? <BarChart3 size={15} /> : <Table2 size={15} />}

              <span className="sr-only">
                {showTable ? "عرض الرسم البياني" : "عرض الجدول"}
              </span>
            </button>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : isEmpty ? (
        <div
          className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line-strong px-4 py-12 text-center"
          style={{ backgroundColor: CHART_COLORS.surface }}
        >
          <p className="text-[13px] text-muted">{emptyText}</p>
        </div>
      ) : showTable ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-start">
            <thead className="sticky top-0 bg-canvas">
              <tr className="border-b border-line">
                {tableHead.map((head) => (
                  <th
                    key={head}
                    scope="col"
                    className="whitespace-nowrap px-3 py-2 text-start text-[11.5px] font-bold uppercase tracking-wide text-muted"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {tableRows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      /* tabular figures here, where numbers align down a
                         column — never on the hero/stat values. */
                      className="tnum whitespace-nowrap px-3 py-2 text-[12.5px] text-ink-soft"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
