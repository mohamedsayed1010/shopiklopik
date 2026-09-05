import { useCallback } from "react";
import Seo from "../../../components/Seo";
import { Megaphone, RotateCw, ShieldCheck } from "lucide-react";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import Modal from "../../../components/ui/Modal";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import AdminPagination from "../../../components/admin/AdminPagination";
import { AdminBannersProvider } from "../../../context/AdminBannersContext";
import useAdminBannersContext from "../../../hooks/admin/useAdminBannersContext";
import useAdminRecordDeepLink from "../../../hooks/admin/useAdminRecordDeepLink";
import {
  bannerErrorCopy,
  useAdminBannerCenter,
  useAdminBannerRequest,
  useAdminBannerRequests,
} from "../../../hooks/admin/useAdminBannerRequests";
import BannerCenterPanel from "./components/BannerCenterPanel";
import BannerRequestsFilters from "./components/BannerRequestsFilters";
import BannerRequestsTable from "./components/BannerRequestsTable";
import BannerRequestDetails from "./components/BannerRequestDetails";
import BannerAvailabilityPanel from "./components/BannerAvailabilityPanel";
import BannerPricesPanel from "./components/BannerPricesPanel";
import { BANNER_TABS, PAGE_SIZE_OPTIONS } from "./bannersConstants";
import { formatNumber } from "../../../utils/format";
import BackButton from "../../../components/ui/BackButton";

function ForbiddenState({ status }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">
        {status === 401 ? "انتهت صلاحية جلستك" : "لا تملك صلاحية إدارة البانرات"}
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
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <Skeleton className="h-14 w-20 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>

          <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

function RequestsTab() {
  const {
    filters,
    queryFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    hasActiveFilters,
    resetFilters,
    openRequest,
    statusFilter,
    statusesQuery,
    filtersReady,
  } = useAdminBannersContext();

  const listQuery = useAdminBannerRequests({
    filters: queryFilters,
    enabled: filtersReady,
  });

  const result = listQuery.data?.data;

  const requests = result?.items ?? [];

  const status = listQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  return (
    <div className="space-y-5">
      <BannerAvailabilityPanel />

      <BannerRequestsFilters rows={requests} />

      {statusFilter.state === "pending" ? (
        <TableSkeleton />
      ) : statusFilter.state === "unresolved" ? (
        <ErrorState
          title="تعذّر تحديد حالة الطلبات"
          description={
            /* Two different failures, and the administrator needs to know
               which: the vocabulary could not be read at all, or it was read
               and does not contain what the address asked for. */
            statusesQuery.isError
              ? `تعذّر جلب قائمة الحالات المعتمدة من الخادم، فلم يمكن تحديد الحالة "${filters.status}". لم تُعرض أي نتائج بدلًا من عرض قائمة غير مفلترة.`
              : `لا توجد حالة باسم "${filters.status}" ضمن الحالات التي يعلنها الخادم لطلبات البانرات. لم تُعرض أي نتائج بدلًا من عرض قائمة غير مفلترة.`
          }
          onRetry={statusesQuery.refetch}
        />
      ) : listQuery.isLoading ? (
        <TableSkeleton />
      ) : isAuthError ? (
        <ForbiddenState status={status} />
      ) : listQuery.isError ? (
        <ErrorState
          {...bannerErrorCopy(listQuery.error)}
          onRetry={listQuery.refetch}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="لا توجد طلبات مطابقة"
          description={
            hasActiveFilters
              ? "جرّب توسيع نطاق البحث أو مسح الفلاتر المطبّقة."
              : "لم يُرسل أي مُعلن طلب بانر حتى الآن."
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
          /* Paging holds the current rows while the next page lands; dimming
             reads as "working" without a layout collapse. */
          className={`transition-opacity duration-200 ${
            listQuery.isFetching ? "opacity-60" : ""
          }`}
        >
          <BannerRequestsTable requests={requests} onOpen={openRequest} />

          <div className="mt-4">
            <AdminPagination
              result={result}
              pageIndex={pageIndex}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemNoun="طلب"
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AdminBannersDashboard() {
  const { tab, setTab, selectedId, openRequest, closeRequest } =
    useAdminBannersContext();

  /* `/admin/banner-requests/{id}` opens that booking's dialog. The id goes
     straight to the detail query below, which is the same read a clicked row
     makes — so a deep link and a click reach the same place. */
  const { clearDeepLink } = useAdminRecordDeepLink({
    listPath: "/admin/banner-requests",
    open: openRequest,
  });

  /* Closing a dialog a deep link opened also leaves the deep link, so the
     address goes back to describing the list that is on screen. */
  const onCloseRequest = useCallback(() => {
    closeRequest();

    clearDeepLink?.();
  }, [closeRequest, clearDeepLink]);

  const centerQuery = useAdminBannerCenter();

  /* Fires only once a request is opened — a page of rows makes no detail
     requests until one is clicked, and then exactly one. */
  const detailsQuery = useAdminBannerRequest({ id: selectedId });

  const summary = centerQuery.data?.data?.summary;

  const centerStatus = centerQuery.error?.response?.status;

  const centerAuthError = centerStatus === 401 || centerStatus === 403;

  return (
    <>
      <Seo title="مركز البانرات | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <Megaphone size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                مركز البانرات
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {summary
                  ? `${formatNumber(summary.pendingRequests ?? 0)} طلب بانتظار المراجعة.`
                  : "طلبات المُعلنين وإعدادات المساحات."}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => centerQuery.refetch()}
            loading={centerQuery.isFetching && !centerQuery.isLoading}
          >
            <RotateCw size={15} />
            تحديث
          </Button>
        </header>

        {/* Overview */}
        {centerAuthError ? (
          <ForbiddenState status={centerStatus} />
        ) : centerQuery.isError ? (
          <ErrorState
            {...bannerErrorCopy(centerQuery.error)}
            onRetry={centerQuery.refetch}
          />
        ) : (
          <BannerCenterPanel query={centerQuery} onOpenRequest={openRequest} />
        )}

        {/* Tabs */}
        {!centerAuthError && (
          <>
            <div className="mt-8 flex flex-wrap gap-2 border-b border-line pb-3">
              {BANNER_TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-[13px] font-semibold ring-1 ring-inset transition-colors duration-200 ${
                    tab === item.key
                      ? "bg-brand-900 text-white ring-brand-900"
                      : "bg-surface text-ink-soft ring-line-strong hover:bg-brand-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {tab === "requests" && <RequestsTab />}

              {tab === "pricing" && <BannerPricesPanel />}
            </div>
          </>
        )}
      </div>

      <Modal
        open={Boolean(selectedId)}
        onClose={onCloseRequest}
        title="تفاصيل طلب البانر"
        size="lg"
      >
        {selectedId && (
          <BannerRequestDetails
            query={detailsQuery}
            /* Deleting removes the record the dialog is showing, so it
               closes; every other action leaves it open on the new state. */
            onDeleted={onCloseRequest}
          />
        )}
      </Modal>
    </>
  );
}

export default function AdminBannersPage() {
  return (
    <AdminBannersProvider>
      <AdminBannersDashboard />
    </AdminBannersProvider>
  );
}
