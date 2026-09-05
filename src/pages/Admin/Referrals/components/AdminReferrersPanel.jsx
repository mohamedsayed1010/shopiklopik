import { Search, UserSearch, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import AdminPagination from "../../../../components/admin/AdminPagination";
import { inputClass, labelClass } from "../../../../components/ui/formStyles";
import useAdminListUrlState from "../../../../hooks/admin/useAdminListUrlState";
import { urlNumber, urlPositiveInt, urlText } from "../../../../hooks/useUrlState";
import { useAdminReferrers } from "../../../../hooks/admin/useAdminReferrals";
import { formatDate, formatNumber } from "../../../../utils/format";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  referralInitials,
} from "../../../Referrals/referralsConstants";

const URL_STATE = {
  search: { defaultValue: "", parse: urlText, param: "rq" },
  page: { defaultValue: 1, parse: urlPositiveInt, param: "rpage" },
  pageSize: {
    defaultValue: DEFAULT_PAGE_SIZE,
    parse: urlPositiveInt,
    param: "rsize",
  },

  minimumReferrals: { defaultValue: "", parse: urlNumber, param: "minref" },
};

const FILTER_KEYS = ["minimumReferrals"];

const HEADERS = [
  "الداعي",
  "الكود",
  "الإجمالي",
  "مكتملة",
  "قيد الانتظار",
  "مشاركات",
  "نقرات",
  "معدل التحويل",
  "آخر دعوة",
];

/** Printed exactly as sent — see the note on the statistics tile. */
function rate(value) {
  return typeof value === "number" ? String(value) : "—";
}

function Stat({ label, value, tone = "text-ink-soft" }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-muted">{label}</dt>
      <dd className={`tnum text-[13px] font-bold ${tone}`}>{value}</dd>
    </div>
  );
}

function ReferrerCard({ referrer }) {
  return (
    <li className="rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700"
        >
          {referralInitials(referrer.name, referrer.userName)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">
            {referrer.name || referrer.userName || "—"}
          </p>

          <p dir="ltr" className="truncate text-start text-[11.5px] text-muted">
            {referrer.userName ? `@${referrer.userName}` : "—"}
          </p>
        </div>

        <span
          dir="ltr"
          className="shrink-0 rounded-lg bg-canvas px-2 py-1 text-[12px] font-semibold text-ink-soft"
        >
          {referrer.referralCode || "—"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 border-t border-line pt-3">
        <Stat
          label="الإجمالي"
          value={formatNumber(referrer.totalReferrals ?? 0)}
          tone="text-ink"
        />

        <Stat
          label="مكتملة"
          value={formatNumber(referrer.completedReferrals ?? 0)}
          tone="text-emerald-700"
        />

        <Stat
          label="قيد الانتظار"
          value={formatNumber(referrer.pendingReferrals ?? 0)}
          tone="text-amber-700"
        />

        <Stat label="مشاركات" value={formatNumber(referrer.totalShares ?? 0)} />

        <Stat label="نقرات" value={formatNumber(referrer.totalClicks ?? 0)} />

        <Stat label="معدل التحويل" value={rate(referrer.conversionRate)} />

        <div className="col-span-3 min-w-0">
          <dt className="text-[11.5px] text-muted">آخر دعوة</dt>
          <dd className="tnum text-[13px] font-medium text-ink-soft">
            {formatDate(referrer.lastReferralAt) || "—"}
          </dd>
        </div>
      </dl>
    </li>
  );
}

export default function AdminReferrersPanel() {
  const {
    search,
    setSearch,
    debouncedSearch,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
  } = useAdminListUrlState({
    schema: URL_STATE,
    filterKeys: FILTER_KEYS,
  });

  const query = useAdminReferrers({
    filters: {
      search: debouncedSearch || undefined,
      minimumReferrals:
        filters.minimumReferrals === ""
          ? undefined
          : Number(filters.minimumReferrals),
      pageIndex,
      pageSize,
    },
  });

  const result = query.data?.data;

  const referrers = result?.items ?? [];

  const status = query.error?.response?.status;

  return (
    <div>
      {/* ------------------------------- filters ------------------------------ */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-64">
            <label htmlFor="referrers-search" className={labelClass}>
              بحث
            </label>

            <div className="relative">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
              />

              <input
                id="referrers-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="الاسم، اسم المستخدم أو الكود…"
                className={`${inputClass()} ps-11`}
              />
            </div>
          </div>

          <div className="min-w-0 basis-48">
            <label htmlFor="referrers-min" className={labelClass}>
              أقل عدد دعوات
            </label>

            <input
              id="referrers-min"
              type="number"
              min={0}
              inputMode="numeric"
              value={filters.minimumReferrals}
              onChange={(event) =>
                setFilter("minimumReferrals", event.target.value)
              }
              placeholder="0"
              className={`${inputClass()} tnum`}
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X size={15} />
              مسح الفلاتر
            </Button>
          )}
        </div>
      </div>

      {/* -------------------------------- rows -------------------------------- */}
      <div className="mt-5">
        {query.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="mt-2 h-3 w-1/4" />
                </div>

                <Skeleton className="hidden h-3 w-32 shrink-0 md:block" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            title={
              status === 403
                ? "لا تملك صلاحية عرض الداعين"
                : "تعذّر تحميل قائمة الداعين"
            }
            description={
              query.error?.response?.data?.message ||
              "حدث خطأ أثناء جلب الداعين. حاول مرة أخرى."
            }
            onRetry={status === 403 ? undefined : query.refetch}
          />
        ) : referrers.length === 0 ? (
          <EmptyState
            icon={UserSearch}
            title="لا يوجد داعون مطابقون"
            description={
              hasActiveFilters
                ? "جرّب توسيع نطاق البحث أو مسح الفلاتر المطبّقة."
                : "لم يدعُ أي مستخدم آخرين حتى الآن."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={resetFilters}>
                  مسح الفلاتر
                </Button>
              ) : null
            }
          />
        ) : (
          <div
            className={`transition-opacity duration-200 ${
              query.isFetching ? "opacity-60" : ""
            }`}
          >
            {/* phones and tablets */}
            <ul className="space-y-3 lg:hidden">
              {referrers.map((referrer) => (
                <ReferrerCard key={referrer.userId} referrer={referrer} />
              ))}
            </ul>

            {/* desktop */}
            <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs lg:block">
              <table className="w-full min-w-[980px] border-collapse text-start">
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
                  {referrers.map((referrer) => (
                    <tr
                      key={referrer.userId}
                      className="transition-colors duration-150 hover:bg-canvas"
                    >
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700"
                          >
                            {referralInitials(referrer.name, referrer.userName)}
                          </span>

                          <div className="min-w-0">
                            <p className="max-w-[170px] truncate text-[13.5px] font-semibold text-ink">
                              {referrer.name || "—"}
                            </p>

                            <p
                              dir="ltr"
                              className="max-w-[170px] truncate text-start text-[11.5px] text-muted"
                            >
                              @{referrer.userName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {/* The link is the server's; the code is shown, and the
                            link is what the title carries so it can be read
                            without widening the column. */}
                        <span
                          dir="ltr"
                          title={referrer.referralLink || undefined}
                          className="tnum inline-block rounded-lg bg-canvas px-2 py-1 text-[12px] font-semibold text-ink-soft"
                        >
                          {referrer.referralCode || "—"}
                        </span>
                      </td>

                      <td className="tnum whitespace-nowrap px-3 py-3 text-[13px] font-bold text-ink">
                        {formatNumber(referrer.totalReferrals ?? 0)}
                      </td>

                      <td className="tnum whitespace-nowrap px-3 py-3 text-[13px] font-bold text-emerald-700">
                        {formatNumber(referrer.completedReferrals ?? 0)}
                      </td>

                      <td className="tnum whitespace-nowrap px-3 py-3 text-[13px] font-bold text-amber-700">
                        {formatNumber(referrer.pendingReferrals ?? 0)}
                      </td>

                      <td className="tnum whitespace-nowrap px-3 py-3 text-[13px] text-ink-soft">
                        {formatNumber(referrer.totalShares ?? 0)}
                      </td>

                      <td className="tnum whitespace-nowrap px-3 py-3 text-[13px] text-ink-soft">
                        {formatNumber(referrer.totalClicks ?? 0)}
                      </td>

                      <td className="tnum whitespace-nowrap px-3 py-3 text-[13px] text-ink-soft">
                        {rate(referrer.conversionRate)}
                      </td>

                      <td className="tnum whitespace-nowrap px-3 py-3 text-[12.5px] text-muted">
                        {formatDate(referrer.lastReferralAt) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <AdminPagination
                result={result}
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                itemNoun="داعٍ"
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
