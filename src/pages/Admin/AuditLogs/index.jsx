import Seo from "../../../components/Seo";
import { FileClock, RotateCw, ScrollText, ShieldCheck } from "lucide-react";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import AdminPagination from "../../../components/admin/AdminPagination";
import { AdminAuditLogsProvider } from "../../../context/AdminAuditLogsContext";
import useAdminAuditLogsContext from "../../../hooks/admin/useAdminAuditLogsContext";
import useAdminAuditLogs from "../../../hooks/admin/useAdminAuditLogs";
import useAdminAuditLogDetails from "../../../hooks/admin/useAdminAuditLogDetails";
import AdminAuditFilters from "./components/AdminAuditFilters";
import AdminAuditTable from "./components/AdminAuditTable";
import AdminAuditDetails from "./components/AdminAuditDetails";
import { PAGE_SIZE_OPTIONS } from "./auditLogsConstants";
import { formatNumber } from "../../../utils/format";
import BackButton from "../../../components/ui/BackButton";

/** Auth failures are answers, not outages — no retry button on those. */
function ForbiddenState({ status }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">
        {status === 401
          ? "انتهت صلاحية جلستك"
          : "لا تملك صلاحية الاطلاع على سجل العمليات"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        {status === 401
          ? "سجّل الدخول مرة أخرى للمتابعة."
          : "هذه الصفحة مخصّصة لحسابات الإدارة فقط."}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />

          <Skeleton className="h-6 w-24 shrink-0 rounded-full" />

          <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-3/5" />
          </div>

          <Skeleton className="hidden h-3 w-28 shrink-0 md:block" />
        </div>
      ))}
    </div>
  );
}

function AdminAuditLogsDashboard() {
  const {
    queryFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    hasActiveFilters,
    resetFilters,
    selectedEntry,
    openEntry,
    closeEntry,
  } = useAdminAuditLogsContext();

  const listQuery = useAdminAuditLogs({ filters: queryFilters });

  /* Fires only once a row is opened — a page of twenty rows makes no detail
     requests until one is clicked, and then exactly one. The row seeds the
     sheet so it paints immediately; the endpoint still answers and wins. */
  const detailsQuery = useAdminAuditLogDetails({
    id: selectedEntry?.id,
    seed: selectedEntry,
  });

  const result = listQuery.data?.data;

  const entries = result?.items ?? [];

  const status = listQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  /* 429 and 5xx are transient and worth retrying by hand; the wording says
     which one happened rather than showing one generic failure for both. */
  const errorCopy =
    status === 429
      ? {
          title: "عدد كبير من الطلبات",
          description: "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
        }
      : status >= 500
      ? {
          title: "خطأ في الخادم",
          description: "تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.",
        }
      : {
          title: "تعذّر تحميل سجل العمليات",
          description: "حدث خطأ أثناء جلب السجل. تحقّق من الاتصال وحاول مرة أخرى.",
        };

  return (
    <>
      <Seo title="سجل العمليات | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <ScrollText size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                سجل العمليات
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {typeof result?.totalCount === "number"
                  ? `${formatNumber(result.totalCount)} عملية مسجّلة.`
                  : "كل الإجراءات التي نفّذها المسؤولون على المنصة."}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => listQuery.refetch()}
            loading={listQuery.isFetching && !listQuery.isLoading}
          >
            <RotateCw size={15} />
            تحديث
          </Button>
        </header>

        <AdminAuditFilters />

        <div className="mt-5">
          {listQuery.isLoading ? (
            <TableSkeleton />
          ) : isAuthError ? (
            <ForbiddenState status={status} />
          ) : listQuery.isError ? (
            <ErrorState
              title={errorCopy.title}
              description={errorCopy.description}
              onRetry={listQuery.refetch}
            />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={FileClock}
              title="لا توجد عمليات مطابقة"
              description={
                hasActiveFilters
                  ? "جرّب توسيع نطاق البحث أو مسح الفلاتر المطبّقة."
                  : "لم يتم تسجيل أي عملية إدارية حتى الآن."
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
              /* Paging holds the current rows while the next page lands;
                 dimming reads as "working" without a layout collapse. */
              className={`transition-opacity duration-200 ${
                listQuery.isFetching ? "opacity-60" : ""
              }`}
            >
              <AdminAuditTable entries={entries} onOpen={openEntry} />

              <div className="mt-4">
                <AdminPagination
                  result={result}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  itemNoun="عملية"
                  onPageChange={setPageIndex}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminAuditDetails
        open={Boolean(selectedEntry)}
        onClose={closeEntry}
        query={detailsQuery}
      />
    </>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <AdminAuditLogsProvider>
      <AdminAuditLogsDashboard />
    </AdminAuditLogsProvider>
  );
}
