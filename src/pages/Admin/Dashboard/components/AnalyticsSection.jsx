import { Link } from "react-router-dom";
import { Eye, TrendingUp } from "lucide-react";

import ChartCard from "../../../../components/admin/charts/ChartCard";
import TimeSeriesChart from "../../../../components/admin/charts/TimeSeriesChart";
import CategoryBars from "../../../../components/admin/charts/CategoryBars";
import ErrorState from "../../../../components/ui/ErrorState";
import { inputClass } from "../../../../components/ui/formStyles";
import {
  CHART_COLORS,
  RANGE_PRESETS,
} from "../dashboardConstants";
import { formatDate, formatNumber } from "../../../../utils/format";

function adDetailsPath(listing) {
  return `/admin/ads/${listing.listingType}/${listing.listingId}`;
}

export default function AnalyticsSection({
  analytics,
  query,
  rangeKey,
  dates,
  onPresetChange,
  onDateChange,
}) {
  const data = analytics ?? {};

  const isLoading = query.isLoading;

  const adsSeries = [
    {
      key: "ads",
      label: "الإعلانات",
      color: CHART_COLORS.primary,
      points: (data.adsOverTime ?? []).map((p) => ({
        date: p.date,
        value: p.count,
      })),
    },
  ];

  const usersSeries = [
    {
      key: "users",
      label: "المستخدمون",
      color: CHART_COLORS.primary,
      points: (data.usersOverTime ?? []).map((p) => ({
        date: p.date,
        value: p.count,
      })),
    },
  ];

  /* Two series, one axis — both are money in the same currency. */
  const revenueSeries = [
    {
      key: "total",
      label: "إجمالي الإيرادات",
      color: CHART_COLORS.primary,
      points: (data.revenueOverTime ?? []).map((p) => ({
        date: p.date,
        value: p.amount,
      })),
    },
    {
      key: "banner",
      label: "إيرادات البانرات",
      color: CHART_COLORS.secondary,
      points: (data.revenueOverTime ?? []).map((p) => ({
        date: p.date,
        value: p.bannerAmount,
      })),
    },
  ];

  const topListings = data.views?.topListings ?? [];

  return (
    <section>
      {/* ---------------------- one filter row ---------------------- */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
          <TrendingUp
            size={17}
            strokeWidth={2.1}
            aria-hidden="true"
            className="text-brand-500"
          />
          التحليلات
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            role="group"
            aria-label="المدة الزمنية"
            className="no-scrollbar flex gap-1.5 overflow-x-auto"
          >
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => onPresetChange(preset.key)}
                aria-pressed={rangeKey === preset.key}
                className={`shrink-0 cursor-pointer rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-200 ${
                  rangeKey === preset.key
                    ? "border-brand-900 bg-brand-900 text-white"
                    : "border-line bg-surface text-ink-soft hover:border-brand-200 hover:bg-brand-50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {rangeKey === "custom" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="date"
                value={dates.from}
                max={dates.to || undefined}
                aria-label="من تاريخ"
                onChange={(event) => onDateChange("from", event.target.value)}
                className={`${inputClass()} h-10 text-[13px]`}
              />

              <input
                type="date"
                value={dates.to}
                min={dates.from || undefined}
                aria-label="إلى تاريخ"
                onChange={(event) => onDateChange("to", event.target.value)}
                className={`${inputClass()} h-10 text-[13px]`}
              />
            </div>
          )}
        </div>
      </div>

      {query.isError ? (
        <ErrorState
          title="تعذّر تحميل التحليلات"
          description="حدث خطأ أثناء جلب بيانات التحليلات. حاول مرة أخرى."
          onRetry={query.refetch}
        />
      ) : (
        <div
          /* Hold the previous charts at reduced opacity while a new range
             loads — a skeleton flash on every preset click is a layout jump. */
          className={`transition-opacity duration-200 ${
            query.isFetching && !isLoading ? "opacity-60" : ""
          }`}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="الإعلانات عبر الوقت"
              subtitle="عدد الإعلانات المنشورة يوميًا"
              isLoading={isLoading}
              isEmpty={!data.adsOverTime?.length}
              tableHead={["التاريخ", "عدد الإعلانات"]}
              tableRows={(data.adsOverTime ?? []).map((p) => [
                formatDate(p.date),
                formatNumber(p.count),
              ])}
            >
              <TimeSeriesChart series={adsSeries} area />
            </ChartCard>

            <ChartCard
              title="المستخدمون الجدد"
              subtitle="عدد الحسابات المسجّلة يوميًا"
              isLoading={isLoading}
              isEmpty={!data.usersOverTime?.length}
              tableHead={["التاريخ", "عدد المستخدمين"]}
              tableRows={(data.usersOverTime ?? []).map((p) => [
                formatDate(p.date),
                formatNumber(p.count),
              ])}
            >
              <TimeSeriesChart series={usersSeries} area />
            </ChartCard>

            <ChartCard
              title="الإيرادات"
              subtitle="الإجمالي مقابل إيرادات البانرات"
              series={revenueSeries}
              isLoading={isLoading}
              isEmpty={!data.revenueOverTime?.length}
              emptyText="لم تُسجَّل أي إيرادات في هذه المدة."
              tableHead={["التاريخ", "الإجمالي", "البانرات"]}
              tableRows={(data.revenueOverTime ?? []).map((p) => [
                formatDate(p.date),
                formatNumber(Math.round(p.amount ?? 0)),
                formatNumber(Math.round(p.bannerAmount ?? 0)),
              ])}
            >
              <TimeSeriesChart series={revenueSeries} />
            </ChartCard>

            <ChartCard
              title="الإعلانات حسب القسم"
              subtitle="توزيع الإعلانات على الأقسام"
              isLoading={isLoading}
              isEmpty={!data.adsByCategory?.length}
              tableHead={["القسم", "العدد", "النسبة"]}
              tableRows={(data.adsByCategory ?? []).map((c) => [
                c.categoryName,
                formatNumber(c.count),
                `${c.percentage}%`,
              ])}
            >
              <CategoryBars items={data.adsByCategory ?? []} />
            </ChartCard>
          </div>

          {/* ------------------- top categories + views ------------------- */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="أكثر الأقسام نشاطًا"
              subtitle="ترتيب الأقسام حسب عدد الإعلانات"
              isLoading={isLoading}
              isEmpty={!data.topCategories?.length}
              tableHead={["#", "القسم", "العدد", "النسبة"]}
              tableRows={(data.topCategories ?? []).map((c, index) => [
                index + 1,
                c.categoryName,
                formatNumber(c.count),
                `${c.percentage}%`,
              ])}
            >
              <ol className="space-y-2.5">
                {(data.topCategories ?? []).map((category, index) => (
                  <li
                    key={category.categoryId ?? category.categoryName}
                    className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-2"
                  >
                    <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-[11.5px] font-bold text-white">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-soft">
                      {category.categoryName}
                    </span>

                    <span className="tnum shrink-0 text-[12.5px] font-bold text-ink">
                      {formatNumber(category.count)}
                      {/* Parenthesised, matching `CategoryBars` on the card
                          beside it — the two read as one system. */}
                      <span className="ms-1.5 text-[11px] font-medium text-muted">
                        ({category.percentage}%)
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </ChartCard>

            <ChartCard
              title="الأكثر مشاهدة"
              subtitle={
                typeof data.views?.totalViews === "number"
                  ? `${formatNumber(data.views.totalViews)} مشاهدة إجمالية`
                  : undefined
              }
              isLoading={isLoading}
              isEmpty={!topListings.length}
              tableHead={["#", "النوع", "المعرّف", "المشاهدات"]}
              tableRows={topListings.map((listing, index) => [
                index + 1,
                listing.listingTypeName,
                listing.listingId,
                formatNumber(listing.views),
              ])}
            >
              {/* The headline is proportional, not tabular — equal-width digits
                  make a large standalone figure look loose. */}
              <p className="mb-3 flex items-baseline gap-2">
                <Eye size={16} aria-hidden="true" className="text-brand-500" />
                <span className="text-3xl font-extrabold text-ink">
                  {formatNumber(data.views?.totalViews ?? 0)}
                </span>
                <span className="text-[12.5px] text-muted">مشاهدة</span>
              </p>

              <ol className="space-y-2">
                {topListings.map((listing, index) => (
                  <li key={listing.listingId}>
                    {/* Same box as before, now the link itself — see
                        `adDetailsPath`. The hover treatment is the only visual
                        addition: a row that navigates should say so. */}
                    <Link
                      to={adDetailsPath(listing)}
                      className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-2 transition-[border-color,background-color] duration-150 hover:border-brand-200 hover:bg-brand-50"
                    >
                      <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11.5px] font-bold text-brand-700">
                        {index + 1}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-ink-soft">
                          {listing.listingTypeName || "—"}
                        </span>

                        {/* The identifier stays on `title` for anyone who needs
                            it, but a GUID is not something to read: the row
                            resolves to the ad, so it offers that instead. */}
                        <span
                          className="block truncate text-[10.5px] text-brand-600"
                          title={listing.listingId}
                        >
                          فتح الإعلان
                        </span>
                      </span>

                      <span className="tnum shrink-0 text-[12.5px] font-bold text-ink">
                        {formatNumber(listing.views)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </ChartCard>
          </div>
        </div>
      )}

      {isLoading && (
        <span className="sr-only" role="status">
          جارٍ تحميل التحليلات
        </span>
      )}
    </section>
  );
}
