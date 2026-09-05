import { useNavigate } from "react-router-dom";
import Seo from "../../../components/Seo";
import {
  ChevronDown,
  RotateCw,
  Share2,
  ShieldCheck,
  UserSearch,
} from "lucide-react";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import AdminPagination from "../../../components/admin/AdminPagination";
import { selectClass } from "../../../components/ui/formStyles";
import { AdminReferralsProvider } from "../../../context/AdminReferralsContext";
import useAdminReferralsContext from "../../../hooks/admin/useAdminReferralsContext";
import {
  useAdminReferralStatistics,
  useAdminReferrals,
} from "../../../hooks/admin/useAdminReferrals";
import AdminReferralStats, {
  AdminReferralStatsSkeleton,
} from "./components/AdminReferralStats";
import AdminReferralsFilters from "./components/AdminReferralsFilters";
import AdminReferrersPanel from "./components/AdminReferrersPanel";
import AdminReferralsTable, {
  AdminReferralsTableSkeleton,
} from "./components/AdminReferralsTable";
import {
  DEFAULT_TOP_REFERRERS,
  PAGE_SIZE_OPTIONS,
  TOP_REFERRERS_OPTIONS,
} from "../../Referrals/referralsConstants";
import { formatNumber } from "../../../utils/format";
import { useState } from "react";
import BackButton from "../../../components/ui/BackButton";

/** The two lists this route serves; the choice lives in `?tab=`. */
const TABS = [
  { key: "referrals", label: "الدعوات", icon: Share2 },
  { key: "referrers", label: "الداعون", icon: UserSearch },
];

function AuthState({ status }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">
        {status === 401 ? "انتهت صلاحية جلستك" : "لا تملك صلاحية الوصول"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        {status === 401
          ? "سجّل الدخول مرة أخرى للمتابعة."
          : "إدارة الدعوات مخصّصة لحسابات الإدارة فقط."}
      </p>
    </div>
  );
}

/** The server's own message when it sent one, ours only as a fallback. */
function errorCopy(error, fallbackTitle) {
  const status = error?.response?.status;

  const message = error?.response?.data?.message;

  if (status === 429) {
    return {
      title: "عدد كبير من الطلبات",
      description:
        message || "تم تجاوز الحد المسموح مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
    };
  }

  if (status >= 500) {
    return {
      title: "خطأ في الخادم",
      description:
        message || "تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.",
    };
  }

  return {
    title: fallbackTitle,
    description: message || "حدث خطأ أثناء جلب البيانات. حاول مرة أخرى.",
  };
}

function AdminReferralsDashboard() {
  const navigate = useNavigate();

  const {
    queryFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    hasActiveFilters,
    resetFilters,
    tab,
    setTab,
  } = useAdminReferralsContext();

  const [top, setTop] = useState(DEFAULT_TOP_REFERRERS);

  const { statisticsQuery, statistics, topReferrers } =
    useAdminReferralStatistics({ top });

  const listQuery = useAdminReferrals({ filters: queryFilters });

  const result = listQuery.data?.data;

  const referrals = result?.items ?? [];

  const status = listQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  return (
    <>
      <Seo title="إدارة الدعوات | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <Share2 size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                إدارة الدعوات
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {typeof result?.totalCount === "number"
                  ? `${formatNumber(result.totalCount)} دعوة مسجّلة.`
                  : "عرض الدعوات وإحصائياتها."}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              statisticsQuery.refetch();
              listQuery.refetch();
            }}
            loading={listQuery.isFetching && !listQuery.isLoading}
          >
            <RotateCw size={15} />
            تحديث
          </Button>
        </header>

        {/* Statistics + leaderboard */}
        <section className="mb-6">
          {statisticsQuery.isLoading ? (
            <AdminReferralStatsSkeleton />
          ) : statisticsQuery.error?.response?.status === 401 ||
            statisticsQuery.error?.response?.status === 403 ? (
            <AuthState status={statisticsQuery.error.response.status} />
          ) : statisticsQuery.isError ? (
            <ErrorState
              {...errorCopy(statisticsQuery.error, "تعذّر تحميل الإحصائيات")}
              onRetry={statisticsQuery.refetch}
            />
          ) : (
            <AdminReferralStats
              statistics={statistics}
              topReferrers={topReferrers}
              topControl={
                <div className="relative">
                  <select
                    aria-label="عدد الداعين المعروضين"
                    value={top}
                    onChange={(event) => setTop(Number(event.target.value))}
                    className={`${selectClass()} tnum h-10 min-w-[120px] py-0 text-sm`}
                  >
                    {TOP_REFERRERS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        أعلى {option}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-3"
                  />
                </div>
              }
            />
          )}
        </section>

        <div
          role="tablist"
          aria-label="أقسام الدعوات"
          className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          {TABS.map((entry) => {
            const Icon = entry.icon;

            const isActive = entry.key === tab;

            return (
              <button
                key={entry.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(entry.key)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13.5px] font-semibold transition-[background-color,border-color,color] duration-200 ${
                  isActive
                    ? "border-brand-900 bg-brand-900 text-white shadow-xs"
                    : "border-line bg-surface text-ink-soft hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900"
                }`}
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                {entry.label}
              </button>
            );
          })}
        </div>

        {tab === "referrers" ? (
          <AdminReferrersPanel />
        ) : (
          <>
        <AdminReferralsFilters />

        <div className="mt-5">
          {listQuery.isLoading ? (
            <AdminReferralsTableSkeleton />
          ) : isAuthError ? (
            <AuthState status={status} />
          ) : listQuery.isError ? (
            <ErrorState
              {...errorCopy(listQuery.error, "تعذّر تحميل الدعوات")}
              onRetry={listQuery.refetch}
            />
          ) : referrals.length === 0 ? (
            <EmptyState
              icon={Share2}
              title="لا توجد دعوات مطابقة"
              description={
                hasActiveFilters
                  ? "جرّب توسيع نطاق البحث أو مسح الفلاتر المطبّقة."
                  : "لم تُسجَّل أي دعوة حتى الآن."
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
                listQuery.isFetching ? "opacity-60" : ""
              }`}
            >
              <AdminReferralsTable
                referrals={referrals}
                onOpen={(referral) =>
                  navigate(`/admin/referrals/${referral.id}`)
                }
              />

              <div className="mt-4">
                <AdminPagination
                  result={result}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  itemNoun="دعوة"
                  onPageChange={setPageIndex}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </>
  );
}

export default function AdminReferralsPage() {
  return (
    <AdminReferralsProvider>
      <AdminReferralsDashboard />
    </AdminReferralsProvider>
  );
}
