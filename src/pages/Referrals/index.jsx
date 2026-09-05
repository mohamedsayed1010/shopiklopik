import { useCallback, useMemo } from "react";

import useUrlState, {
  urlNumber,
  urlPositiveInt,
} from "../../hooks/useUrlState";
import Seo from "../../components/Seo";
import { ChevronDown, RotateCw, ShieldCheck, UsersRound } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import AdminPagination from "../../components/admin/AdminPagination";
import { labelClass, selectClass } from "../../components/ui/formStyles";
import {
  useMyReferral,
  useMyReferralStatistics,
  useMyReferredUsers,
} from "../../hooks/useReferrals";
import ReferralShareCards, {
  ReferralCardsSkeleton,
} from "./components/ReferralShareCards";
import ReferralStatistics, {
  StatisticsSkeleton,
} from "./components/ReferralStatistics";
import ReferredUsersTable, {
  ReferredUsersSkeleton,
} from "./components/ReferredUsersTable";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "./referralsConstants";

function statusOptionsFrom(rows) {
  const byValue = new Map();

  rows.forEach((row) => {
    if (row?.status === undefined || row?.status === null) return;

    if (!byValue.has(row.status)) {
      byValue.set(row.status, row.statusName ?? String(row.status));
    }
  });

  return [...byValue.entries()].map(([value, label]) => ({ value, label }));
}

function AuthState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">انتهت صلاحية جلستك</h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        سجّل الدخول مرة أخرى لعرض برنامج الدعوات الخاص بك.
      </p>
    </div>
  );
}

/** The server's own words when it sent any, ours only as a fallback. */
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

const URL_STATE = {
  status: { defaultValue: "", parse: urlNumber },
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: DEFAULT_PAGE_SIZE, parse: urlPositiveInt },
};

export default function ReferralsPage() {
  const { values, setValues } = useUrlState(URL_STATE);

  /* A string for the <select>, which compares by string. */
  const status = values.status === "" ? "" : String(values.status);

  const pageIndex = values.page;

  const pageSize = values.pageSize;

  const setPageIndex = useCallback((page) => setValues({ page }), [setValues]);

  const { referralQuery, referral } = useMyReferral();

  const { statisticsQuery, statistics } = useMyReferralStatistics();

  const filters = useMemo(
    () => ({
      status: status === "" ? undefined : Number(status),
      pageIndex,
      pageSize,
    }),
    [status, pageIndex, pageSize]
  );

  const { usersQuery, result } = useMyReferredUsers({ filters });

  const users = result?.items ?? [];

  /* Page one, unfiltered — the source of the status dropdown's options. */
  const optionsFilters = useMemo(
    () => ({ pageIndex: 1, pageSize }),
    [pageSize]
  );

  const { result: unfiltered } = useMyReferredUsers({
    filters: optionsFilters,
  });

  const statusOptions = useMemo(
    () => statusOptionsFrom(unfiltered?.items ?? []),
    [unfiltered]
  );

  const isUnauthenticated =
    referralQuery.error?.response?.status === 401 ||
    usersQuery.error?.response?.status === 401;

  return (
    <>
      <Seo title="برنامج الدعوات" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          title="برنامج الدعوات"
          subtitle="ادعُ أصدقاءك إلى شوبيك لوبيك وتابع دعواتك."
          className="mb-6"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                referralQuery.refetch();
                statisticsQuery.refetch();
                usersQuery.refetch();
              }}
              loading={
                (referralQuery.isFetching && !referralQuery.isLoading) ||
                (usersQuery.isFetching && !usersQuery.isLoading)
              }
            >
              <RotateCw size={15} />
              تحديث
            </Button>
          }
        />

        {isUnauthenticated ? (
          <AuthState />
        ) : (
          <div className="space-y-8">
            {/* Code + link */}
            <section>
              {referralQuery.isLoading ? (
                <ReferralCardsSkeleton />
              ) : referralQuery.isError ? (
                <ErrorState
                  {...errorCopy(referralQuery.error, "تعذّر تحميل كود الدعوة")}
                  onRetry={referralQuery.refetch}
                />
              ) : (
                <ReferralShareCards referral={referral} />
              )}
            </section>

            {/* Statistics */}
            <section>
              <h2 className="mb-3 flex items-center gap-2.5 text-sm font-bold text-ink">
                <span
                  aria-hidden="true"
                  className="h-4 w-1 rounded-full bg-gold-300"
                />
                إحصائيات الدعوات
              </h2>

              {statisticsQuery.isLoading ? (
                <StatisticsSkeleton />
              ) : statisticsQuery.isError ? (
                <ErrorState
                  {...errorCopy(statisticsQuery.error, "تعذّر تحميل الإحصائيات")}
                  onRetry={statisticsQuery.refetch}
                />
              ) : (
                <ReferralStatistics statistics={statistics} />
              )}
            </section>

            {/* Referred users */}
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <h2 className="flex items-center gap-2.5 text-sm font-bold text-ink">
                  <span
                    aria-hidden="true"
                    className="h-4 w-1 rounded-full bg-gold-300"
                  />
                  المستخدمون المدعوون
                </h2>

                {statusOptions.length > 0 && (
                  <div className="min-w-0">
                    <label htmlFor="referral-status" className={labelClass}>
                      الحالة
                    </label>

                    <div className="relative">
                      <select
                        id="referral-status"
                        value={status}
                        onChange={(event) => {
                          setValues({
                            status: event.target.value,
                            page: 1,
                          });
                        }}
                        className={`${selectClass()} h-11 min-w-[180px]`}
                      >
                        <option value="">كل الحالات</option>

                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
                      />
                    </div>
                  </div>
                )}
              </div>

              {usersQuery.isLoading ? (
                <ReferredUsersSkeleton />
              ) : usersQuery.isError ? (
                <ErrorState
                  {...errorCopy(usersQuery.error, "تعذّر تحميل قائمة المدعوين")}
                  onRetry={usersQuery.refetch}
                />
              ) : users.length === 0 ? (
                <EmptyState
                  icon={UsersRound}
                  title={
                    status === ""
                      ? "لا توجد دعوات بعد"
                      : "لا توجد دعوات بهذه الحالة"
                  }
                  description={
                    status === ""
                      ? "شارك كود أو رابط الدعوة مع أصدقائك، وسيظهر هنا كل من ينضم عبرك."
                      : "جرّب اختيار حالة أخرى أو اعرض كل الحالات."
                  }
                  action={
                    status === "" ? null : (
                      <Button
                        variant="outline"
                        onClick={() => setValues({ status: "", page: 1 })}
                      >
                        عرض كل الحالات
                      </Button>
                    )
                  }
                />
              ) : (
                <div
                  className={`transition-opacity duration-200 ${
                    usersQuery.isFetching ? "opacity-60" : ""
                  }`}
                >
                  <ReferredUsersTable users={users} />

                  <div className="mt-4">
                    <AdminPagination
                      result={result}
                      pageIndex={pageIndex}
                      pageSize={pageSize}
                      pageSizeOptions={PAGE_SIZE_OPTIONS}
                      itemNoun="مدعو"
                      onPageChange={setPageIndex}
                      onPageSizeChange={(size) =>
                        setValues({ pageSize: size, page: 1 })
                      }
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
