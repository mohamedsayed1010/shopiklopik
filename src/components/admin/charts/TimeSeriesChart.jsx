import { useMemo, useState } from "react";

import useElementWidth from "../../../hooks/useElementWidth";
import { CHART_COLORS } from "../../../pages/Admin/Dashboard/dashboardConstants";
import { formatNumber, parseApiDate } from "../../../utils/format";

const HEIGHT = 210;

/* Room for the axis labels *inside* the measured box, so the card never grows a
   nested scrollbar to show the dates under the plot. */
const PADDING = { top: 12, right: 8, bottom: 26, left: 44 };

/** Round the axis top to something a person would choose. */
function niceMax(value) {
  if (value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));

  const steps = [1, 2, 2.5, 5, 10];

  return (
    magnitude * (steps.find((step) => value <= magnitude * step) ?? 10)
  );
}

const shortDate = (date) =>
  date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });

export default function TimeSeriesChart({
  series = [],
  area = false,
  valueFormatter = formatNumber,
}) {
  const [wrapRef, width] = useElementWidth();

  const [hoverIndex, setHoverIndex] = useState(null);

  const model = useMemo(() => {
    /* Every timestamp any series mentions, deduped and ordered — the shared
       x domain, and the set the crosshair snaps to. */
    const stamps = [
      ...new Set(
        series.flatMap((entry) =>
          (entry.points ?? [])
            .map((point) => parseApiDate(point.date)?.getTime())
            .filter(Boolean)
        )
      ),
    ].sort((a, b) => a - b);

    if (stamps.length === 0) return null;

    const minX = stamps[0];

    const maxX = stamps[stamps.length - 1];

    const peak = Math.max(
      ...series.flatMap((entry) =>
        (entry.points ?? []).map((point) => Number(point.value) || 0)
      ),
      0
    );

    return { stamps, minX, maxX, maxY: niceMax(peak) };
  }, [series]);

  if (!model || width <= 0) {
    return <div ref={wrapRef} style={{ height: HEIGHT }} />;
  }

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 10);

  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  /* A single point has no span to spread across, so it sits centred rather than
     dividing by zero. */
  const span = model.maxX - model.minX;

  const xOf = (time) =>
    PADDING.left +
    (span === 0 ? plotWidth / 2 : ((time - model.minX) / span) * plotWidth);

  const yOf = (value) =>
    PADDING.top + plotHeight - (Math.max(value, 0) / model.maxY) * plotHeight;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: model.maxY * ratio,
    y: PADDING.top + plotHeight - ratio * plotHeight,
  }));

  const hoverTime = hoverIndex === null ? null : model.stamps[hoverIndex];

  const buildPath = (points) =>
    points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

  const resolved = series.map((entry) => {
    const points = (entry.points ?? [])
      .map((point) => {
        const date = parseApiDate(point.date);

        return date
          ? {
              time: date.getTime(),
              x: xOf(date.getTime()),
              y: yOf(Number(point.value) || 0),
              value: Number(point.value) || 0,
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    return { ...entry, resolvedPoints: points };
  });

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`رسم بياني زمني: ${series
          .map((entry) => entry.label)
          .join("، ")}`}
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();

          const x = event.clientX - box.left;

          /* Snap to the nearest real point rather than requiring a hit on the
             mark itself — an 8px dot is not a hit target. */
          let nearest = 0;

          let best = Infinity;

          model.stamps.forEach((time, index) => {
            const distance = Math.abs(xOf(time) - x);

            if (distance < best) {
              best = distance;

              nearest = index;
            }
          });

          setHoverIndex(nearest);
        }}
      >
        {/* Hairline grid, solid — dashed rules read as thresholds. */}
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PADDING.left}
              x2={width - PADDING.right}
              y1={tick.y}
              y2={tick.y}
              stroke={CHART_COLORS.grid}
              strokeWidth="1"
            />

            <text
              x={PADDING.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="tnum"
              fontSize="10"
              fill={CHART_COLORS.axis}
            >
              {valueFormatter(Math.round(tick.value))}
            </text>
          </g>
        ))}

        {/* First and last date only — a label per point collides on mobile. */}
        {[model.minX, model.maxX].map((time, index) => (
          <text
            key={time}
            x={xOf(time)}
            y={HEIGHT - 8}
            textAnchor={
              span === 0 ? "middle" : index === 0 ? "start" : "end"
            }
            fontSize="10"
            fill={CHART_COLORS.axis}
          >
            {shortDate(new Date(time))}
          </text>
        ))}

        {resolved.map((entry) => {
          const points = entry.resolvedPoints;

          if (points.length === 0) return null;

          const baseline = PADDING.top + plotHeight;

          return (
            <g key={entry.key}>
              {area && points.length > 1 && (
                <path
                  d={`${buildPath(points)} L ${points.at(-1).x} ${baseline} L ${
                    points[0].x
                  } ${baseline} Z`}
                  fill={entry.color}
                  opacity="0.10"
                />
              )}

              {points.length > 1 ? (
                <path
                  d={buildPath(points)}
                  fill="none"
                  stroke={entry.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <circle
                  cx={points[0].x}
                  cy={points[0].y}
                  r="4"
                  fill={entry.color}
                  stroke={CHART_COLORS.surface}
                  strokeWidth="2"
                />
              )}

              {/* Only the hovered point gets a marker; a dot on every point is
                  noise, and the endpoint value is in the tooltip and table. */}
              {hoverTime !== null &&
                (() => {
                  const match = points.find((point) => point.time === hoverTime);

                  if (!match) return null;

                  return (
                    <circle
                      cx={match.x}
                      cy={match.y}
                      r="4.5"
                      fill={entry.color}
                      stroke={CHART_COLORS.surface}
                      strokeWidth="2"
                    />
                  );
                })()}
            </g>
          );
        })}

        {hoverTime !== null && (
          <line
            x1={xOf(hoverTime)}
            x2={xOf(hoverTime)}
            y1={PADDING.top}
            y2={PADDING.top + plotHeight}
            stroke={CHART_COLORS.axis}
            strokeWidth="1"
            opacity="0.35"
          />
        )}
      </svg>

      {/* Tooltip enhances; the same numbers are in the card's table view. */}
      {hoverTime !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-[128px] -translate-x-1/2 rounded-xl border border-line bg-surface px-2.5 py-2 shadow-lg"
          style={{
            insetInlineStart: undefined,
            left: Math.min(Math.max(xOf(hoverTime), 70), width - 70),
            top: 4,
          }}
        >
          <p className="mb-1 text-[11px] font-semibold text-muted">
            {new Date(hoverTime).toLocaleDateString("ar-EG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {resolved.map((entry) => {
            const match = entry.resolvedPoints.find(
              (point) => point.time === hoverTime
            );

            return (
              <p
                key={entry.key}
                className="flex items-center justify-between gap-3 text-[12px]"
              >
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.label}
                </span>

                <span className="tnum font-bold text-ink">
                  {match ? valueFormatter(match.value) : "—"}
                </span>
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
