import { useCallback } from "react";
import Seo from "../../../components/Seo";
import { Flag, RotateCw, ShieldAlert, ShieldCheck } from "lucide-react";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import AdminPagination from "../../../components/admin/AdminPagination";
import { AdminReportsProvider } from "../../../context/AdminReportsContext";
import useAdminReportsContext from "../../../hooks/admin/useAdminReportsContext";
import {
  useAdminReportActions,
  useAdminReports,
} from "../../../hooks/admin/useAdminReports";
import AdminReportsFilters from "./components/AdminReportsFilters";
import AdminReportsTable from "./components/AdminReportsTable";
import AdminReportDetails from "./components/AdminReportDetails";
import ReportActionDialogs from "./components/ReportActionDialogs";
import useAdminReportDeepLink from "./useAdminReportDeepLink";
import { PAGE_SIZE_OPTIONS, isOpenStatus } from "./reportsConstants";
import { formatNumber } from "../../../utils/format";
import BackButton from "../../../components/ui/BackButton";

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
          : "إدارة البلاغات مخصّصة لحسابات الإدارة فقط."}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <Skeleton className="h-3 w-3 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>

          <Skeleton className="hidden h-6 w-24 shrink-0 rounded-full sm:block" />
          <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full md:block" />
          <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function AdminReportsDashboard() {
  const {
    queryFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    hasActiveFilters,
    resetFilters,
    selectedReport,
    openReport,
    closeReport,
    dialog,
    openDialog,
    closeDialog,
  } = useAdminReportsContext();

  const listQuery = useAdminReports({ filters: queryFilters });

  /* A decision closes its dialog and the sheet behind it — the report it was
     describing has just been resolved. */
  const onActionSuccess = useCallback(() => {
    closeDialog();

    closeReport();
  }, [closeDialog, closeReport]);

  const actions = useAdminReportActions({ onActionSuccess });

  const result = listQuery.data?.data;

  const reports = result?.items ?? [];

  const status = listQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  const openCount = reports.filter((r) => isOpenStatus(r.statusName)).length;

  /* `/admin/reports/{id}` opens that report's drawer. The row is the record —
     there is no endpoint that returns one report — so the deep link waits for
     the list rather than firing a read of its own. */
  const { isMissing, reportId, clearDeepLink } = useAdminReportDeepLink({
    reports,
    isSettled: listQuery.isSuccess && !listQuery.isFetching,
    openReport,
  });

  /* Closing a drawer that a deep link opened also leaves the deep link, so the
     address goes back to describing the list that is on screen. */
  const onCloseDetails = useCallback(() => {
    closeReport();

    clearDeepLink?.();
  }, [closeReport, clearDeepLink]);

  const errorCopy =
    status === 429
      ? {
          title: "عدد كبير من الطلبات",
          description: "تم تجاوز الحد المسموح مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
        }
      : status >= 500
      ? {
          title: "خطأ في الخادم",
          description: "تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.",
        }
      : {
          title: "تعذّر تحميل البلاغات",
          description: "حدث خطأ أثناء جلب البلاغات. تحقّق من الاتصال وحاول مرة أخرى.",
        };

  const dialogReport = selectedReport;

  return (
    <>
      <Seo title="إدارة البلاغات | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1300px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <ShieldAlert size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                إدارة البلاغات
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                مراجعة بلاغات المستخدمين عن الإعلانات واتخاذ القرار المناسب.
                {typeof result?.totalCount === "number" && (
                  <span className="tnum">
                    {" "}
                    {formatNumber(result.totalCount)} بلاغ.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Only what is on the page — the endpoint publishes no
                pending-count, so this does not claim to be a global figure. */}
            {openCount > 0 && (
              <span className="tnum inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1.5 text-[12.5px] font-bold text-gold-700 ring-1 ring-inset ring-gold-200">
                <Flag size={13} aria-hidden="true" />
                {formatNumber(openCount)} بانتظار المراجعة
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => listQuery.refetch()}
              loading={listQuery.isFetching && !listQuery.isLoading}
            >
              <RotateCw size={15} />
              تحديث
            </Button>
          </div>
        </header>

        <AdminReportsFilters />

        <div className="mt-5">
          {listQuery.isLoading ? (
            <TableSkeleton />
          ) : isAuthError ? (
            <AuthState status={status} />
          ) : listQuery.isError ? (
            <ErrorState
              title={errorCopy.title}
              description={errorCopy.description}
              onRetry={listQuery.refetch}
            />
          ) : isMissing ? (
            <ErrorState
              title="البلاغ غير موجود في هذه الصفحة"
              description={`البلاغ ${reportId} ليس ضمن النتائج المعروضة حاليًا. قد يكون في صفحة أخرى أو مستبعدًا بالفلاتر المطبّقة — لا توفّر واجهة البرمجة طريقة لجلب بلاغ واحد بمعرّفه.`}
              onRetry={clearDeepLink ?? undefined}
            />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={hasActiveFilters ? "لا توجد بلاغات مطابقة" : "لا توجد بلاغات"}
              description={
                hasActiveFilters
                  ? "جرّب توسيع نطاق البحث أو مسح الفلاتر المطبّقة."
                  : "لم يُبلِّغ أي مستخدم عن إعلان حتى الآن."
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
              <AdminReportsTable
                reports={reports}
                onOpen={openReport}
                onIgnore={(report) => openDialog("ignore", report)}
                onAction={(report) => openDialog("action", report)}
                disabled={actions.isPending}
              />

              <div className="mt-4">
                <AdminPagination
                  result={result}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  itemNoun="بلاغ"
                  onPageChange={setPageIndex}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminReportDetails
        /* Hidden rather than unmounted while a dialog is up, so the sheet is
           still behind it when the dialog is dismissed. */
        open={Boolean(selectedReport) && !dialog}
        onClose={onCloseDetails}
        report={selectedReport}
        onIgnore={(report) => openDialog("ignore", report)}
        onAction={(report) => openDialog("action", report)}
        onUpdate={(report) => openDialog("update", report)}
      />

      <ReportActionDialogs
        dialog={dialog}
        report={dialogReport}
        onClose={closeDialog}
        {...actions}
      />
    </>
  );
}

export default function AdminReportsPage() {
  return (
    <AdminReportsProvider>
      <AdminReportsDashboard />
    </AdminReportsProvider>
  );
}
