import { useCallback } from "react";
import Seo from "../../../components/Seo";
import { Inbox, RotateCw, ShieldCheck } from "lucide-react";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import { AdminAdsProvider } from "../../../context/AdminAdsContext";
import useAdminAdsContext from "../../../hooks/admin/useAdminAdsContext";
import { PAGE_SIZE_OPTIONS } from "./adminAdsConstants";
import useAdminAds from "../../../hooks/admin/useAdminAds";
import useAdminAdsStats from "../../../hooks/admin/useAdminAdsStats";
import useAdminAdDetails from "../../../hooks/admin/useAdminAdDetails";
import useAdminAdActions from "../../../hooks/admin/useAdminAdActions";
import useAdminAdsMetadata from "../../../hooks/admin/useAdminAdsMetadata";
import useAdminAdDeepLink from "./useAdminAdDeepLink";
import AdminAdsStats from "./components/AdminAdsStats";
import AdminAdsTabs from "./components/AdminAdsTabs";
import AdminAdsFilters from "./components/AdminAdsFilters";
import AdminAdsTable from "./components/AdminAdsTable";
import AdminPagination from "../../../components/admin/AdminPagination";
import AdminAdDetails from "./components/AdminAdDetails";
import AdminAdActionDialogs from "./components/AdminAdActionDialogs";
import BackButton from "../../../components/ui/BackButton";

/** A 401/403 is not a network error, and must not offer a pointless retry. */
function ForbiddenState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">
        لا تملك صلاحية الوصول لهذه البيانات
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        هذه الصفحة مخصّصة لحسابات الإدارة فقط. إذا كنت تعتقد أن هذا خطأ، سجّل
        الخروج ثم سجّل الدخول مرة أخرى بحساب إداري.
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
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>

          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          <Skeleton className="hidden h-6 w-20 rounded-full md:block" />
          <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function AdminAdsDashboard() {
  const {
    tabKey,
    setTabKey,
    activeTab,
    queryFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    selectedAd,
    openDetails,
    closeDetails,
    action,
    openAction,
    closeAction,
    hasActiveFilters,
    resetFilters,
  } = useAdminAdsContext();

  const listQuery = useAdminAds({
    endpoint: activeTab.endpoint,
    filters: queryFilters,
  });

  const { cards, pendingCount } = useAdminAdsStats();

  /* Already loaded for the filter bar — the deep link reads `modules` from the
     same cached response rather than costing a request of its own. */
  const { modules } = useAdminAdsMetadata();

  /* `/admin/ads/{module}/{id}` opens that record. Ordinary browsing does not
     hit this at all: the route without params supplies no id. */
  const { clearDeepLink } = useAdminAdDeepLink({ modules, openDetails });

  const detailsQuery = useAdminAdDetails({
    type: selectedAd?.type,
    id: selectedAd?.id,
  });

  /* A decision taken from inside the details sheet should leave the sheet —
     the ad it was describing has just changed state or stopped existing. */
  const onActionSuccess = useCallback(() => {
    closeAction();

    closeDetails();
  }, [closeAction, closeDetails]);

  const actions = useAdminAdActions({ onActionSuccess });

  const result = listQuery.data?.data;

  const ads = result?.items ?? [];

  const status = listQuery.error?.response?.status;

  const isForbidden = status === 401 || status === 403;

  /* The dialogs act on whichever ad is selected, whether that came from a row
     button or from the details sheet. Details is the richer object when it has
     loaded, so it wins — its `typeId` and title are the same values either way. */
  const dialogAd = selectedAd
    ? {
        type: selectedAd.type,
        id: selectedAd.id,
        title: detailsQuery.data?.data?.title ?? selectedAd.title,
      }
    : null;

  return (
    <>
      <Seo title="إدارة الإعلانات | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1400px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <ShieldCheck size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                إدارة الإعلانات
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                مراجعة الإعلانات والموافقة عليها أو رفضها وإيقافها.
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

        <AdminAdsStats
          cards={cards}
          activeTabKey={tabKey}
          onSelect={setTabKey}
        />

        <div className="mt-6">
          <AdminAdsTabs
            activeKey={tabKey}
            onChange={setTabKey}
            pendingCount={pendingCount}
          />
        </div>

        <div className="mt-4">
          <AdminAdsFilters />
        </div>

        <div className="mt-5">
          {listQuery.isLoading ? (
            <TableSkeleton />
          ) : isForbidden ? (
            <ForbiddenState />
          ) : listQuery.isError ? (
            <ErrorState
              title="تعذّر تحميل الإعلانات"
              description="حدث خطأ أثناء جلب قائمة الإعلانات. تحقّق من الاتصال وحاول مرة أخرى."
              onRetry={listQuery.refetch}
            />
          ) : ads.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="لا توجد إعلانات مطابقة للبحث الحالي."
              description={
                hasActiveFilters
                  ? "جرّب توسيع نطاق البحث أو مسح الفلاتر المطبّقة."
                  : "لا توجد إعلانات في هذا القسم حتى الآن."
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
              /* Paging keeps the old rows on screen while the next page loads;
                 dimming them says "working" without a layout collapse. */
              className={`transition-opacity duration-200 ${
                listQuery.isFetching ? "opacity-60" : ""
              }`}
            >
              <AdminAdsTable
                ads={ads}
                onDetails={openDetails}
                onAction={openAction}
                disabled={actions.isPending}
              />

              <div className="mt-4">
                <AdminPagination
                  result={result}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  itemNoun="إعلان"
                  onPageChange={setPageIndex}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminAdDetails
        open={Boolean(selectedAd) && !action}
        onClose={() => {
          closeDetails();

          // Arrived by deep link: leave the record address, keep the filters.
          clearDeepLink?.();
        }}
        query={detailsQuery}
        onAction={(name, ad) =>
          openAction(name, { typeId: ad.typeId, id: ad.id, title: ad.title })
        }
      />

      <AdminAdActionDialogs
        action={action}
        ad={dialogAd}
        onClose={closeAction}
        {...actions}
      />
    </>
  );
}

export default function AdminAdsPage() {
  return (
    <AdminAdsProvider>
      <AdminAdsDashboard />
    </AdminAdsProvider>
  );
}
