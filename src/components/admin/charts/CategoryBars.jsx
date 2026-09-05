import { CHART_COLORS } from "../../../pages/Admin/Dashboard/dashboardConstants";
import { formatNumber } from "../../../utils/format";

export default function CategoryBars({ items = [], max }) {
  const peak = max ?? Math.max(...items.map((item) => item.count || 0), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const ratio = Math.max((item.count || 0) / peak, 0);

        return (
          <li key={item.categoryId ?? item.categoryName}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[13px] font-medium text-ink-soft">
                {item.categoryName || "—"}
              </span>

              <span className="tnum shrink-0 text-[12.5px] text-muted">
                {formatNumber(item.count)}
                {typeof item.percentage === "number" && (
                  <span className="ms-1.5 text-[11.5px]">
                    ({item.percentage}%)
                  </span>
                )}
              </span>
            </div>

            {/* The track is the band; the bar is capped inside it. */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-e-[4px]"
                style={{
                  width: `${Math.max(ratio * 100, 1.5)}%`,
                  backgroundColor: CHART_COLORS.primary,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
