import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Inbox, RotateCw, ShieldCheck, Wallet } from "lucide-react";

import Seo from "../../../components/Seo";
import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Modal from "../../../components/ui/Modal";
import Skeleton from "../../../components/ui/Skeleton";
import AdminPagination from "../../../components/admin/AdminPagination";
import useAdminAccess, { useAdminPermissionPages } from "../../../hooks/admin/useAdminPermissions";
import { pageForPath } from "../../../utils/adminPermissions";
import useAdminListUrlState from "../../../hooks/admin/useAdminListUrlState";
import useAdminRecordDeepLink from "../../../hooks/admin/useAdminRecordDeepLink";
import useAdminAdsMetadata from "../../../hooks/admin/useAdminAdsMetadata";
import {
  urlDate,
  urlNumber,
  urlOneOf,
  urlPositiveInt,
  urlText,
  useUrlDraftMap,
} from "../../../hooks/useUrlState";
import {
  useAdPaymentHistory,
  useAdPaymentSubmission,
  useAdPaymentSubmissions,
} from "../../../hooks/admin/useAdminAdPayment";
import {
  AD_PAYMENT_DEFAULT_PAGE_SIZE,
  AD_PAYMENT_PAGE_SIZES,
  AD_PAYMENT_STATUS_VALUES,
  AD_PAYMENT_TYPE_VALUES,
  adPaymentErrorCopy,
  dateRangeError,
  isUuid,
} from "../../../utils/adPayment";
import AdPaymentFilters from "./components/AdPaymentFilters";
import AdPaymentTable from "./components/AdPaymentTable";
import AdPaymentDetails from "./components/AdPaymentDetails";
import AdPaymentReviewDialog from "./components/AdPaymentReviewDialog";
import AdPaymentSettingsPanel from "./components/AdPaymentSettingsPanel";

/** The route the backend's `payments` permission page declares (`/payments`). */
const ROUTE = "/admin/payments";

const TABS = [
  { key: "submissions", label: "طلبات الدفع", icon: Inbox },
  { key: "history", label: "سجل المدفوعات", icon: History },
  { key: "settings", label: "إعدادات الدفع", icon: Wallet },
];

const FILTER_KEYS = ["status", "type", "categoryId", "userId", "advertisementId", "fromDate", "toDate"];

/** Typed ids settle before they reach the address and the request. */
const TEXT_KEYS = ["userId", "advertisementId"];

const URL_STATE = {
  tab: { defaultValue: TABS[0].key, parse: urlOneOf(TABS.map((tab) => tab.key)) },
  search: { defaultValue: "", parse: urlText },
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: AD_PAYMENT_DEFAULT_PAGE_SIZE, parse: urlPositiveInt },
  status: { defaultValue: "", parse: urlNumber },
  type: { defaultValue: "", parse: urlNumber },
  categoryId: { defaultValue: "", parse: urlNumber },
  userId: { defaultValue: "", parse: urlText },
  advertisementId: { defaultValue: "", parse: urlText },
  fromDate: { defaultValue: "", parse: urlDate },
  toDate: { defaultValue: "", parse: urlDate },
};

function ForbiddenState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">لا تملك صلاحية عرض المدفوعات</h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        هذه الصفحة تتطلب صلاحية «عرض» على صفحة المدفوعات.
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
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

/* One list (submissions or history). Server-side filters and paging only: the
   page asks for exactly one page and never filters rows itself. */
function PaymentsList({ kind, queryFilters, enabled, blockedReason, hasActiveFilters, resetFilters, pageIndex, setPageIndex, pageSize, setPageSize, onOpen, onRows }) {
  const useList = kind === "history" ? useAdPaymentHistory : useAdPaymentSubmissions;

  const listQuery = useList({ filters: queryFilters, enabled });

  const result = listQuery.data?.data;

  const rows = useMemo(() => (Array.isArray(result?.items) ? result.items : []), [result]);

  useEffect(() => {
    onRows?.(rows);
  }, [rows, onRows]);

  if (blockedReason) {
    return <ErrorState title="راجع الفلاتر" description={blockedReason} />;
  }

  if (listQuery.isLoading) return <TableSkeleton />;

  if (listQuery.isError) {
    const copy = adPaymentErrorCopy(listQuery.error, { subject: "المدفوعات" });

    return copy.status === 403 ? (
      <ForbiddenState />
    ) : (
      <ErrorState title={copy.title} description={copy.description} onRetry={listQuery.refetch} />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={kind === "history" ? History : Inbox}
        title={kind === "history" ? "لا توجد مدفوعات في السجل" : "لا توجد طلبات دفع"}
        description={
          hasActiveFilters
            ? "لا توجد نتائج مطابقة للفلاتر المطبّقة."
            : kind === "history"
              ? "لم تُسجَّل أي مدفوعات للإعلانات بعد."
              : "لم يُرسل أي معلن إثبات دفع حتى الآن."
        }
        action={
          hasActiveFilters ? (
            <Button variant="outline" onClick={resetFilters}>مسح الفلاتر</Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className={`transition-opacity duration-200 ${listQuery.isFetching ? "opacity-60" : ""}`}>
      <AdPaymentTable
        rows={rows}
        onOpen={onOpen}
        dateField={kind === "history" ? "reviewedAt" : "submittedAt"}
      />

      <div className="mt-4">
        {/* Uses the response's own hasPrevious/hasNext and counts. */}
        <AdminPagination
          result={result}
          pageIndex={result?.pageIndex || pageIndex}
          pageSize={result?.pageSize || pageSize}
          pageSizeOptions={AD_PAYMENT_PAGE_SIZES}
          itemNoun="طلب"
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const { canOnRoute, isSuperAdmin, resolved, pages, isAdmin } = useAdminAccess();

  /* `canOnRoute` answers "yes" for a page the catalogue does not list yet, so
     until the catalogue has been read (or failed), only a visible grant counts.
     Otherwise an account without the payments page would fire one request
     before AdminRoute redirects it. */
  const { pagesQuery } = useAdminPermissionPages({ enabled: isAdmin });

  const permissionsSettled =
    isSuperAdmin ||
    !resolved ||
    Boolean(pageForPath(pages, ROUTE, "/admin")) ||
    pagesQuery.isFetched;

  const canView = permissionsSettled && canOnRoute(ROUTE, "View");

  const canEdit = canOnRoute(ROUTE, "Edit");

  /* PATCH .../review is authorised by `payments → View` (Swagger's
     x-admin-authorization, checked by the server on every request) — not by an
     Approve grant. Gating it on Approve hid review from admins the backend lets
     review. The server stays authoritative: a 403 is shown as such. */
  const canApprove = canView;

  const {
    values,
    setValues,
    filters: committed,
    setFilter: commitFilter,
    resetFilters,
    hasActiveFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
  } = useAdminListUrlState({ schema: URL_STATE, filterKeys: FILTER_KEYS });

  const tab = values.tab;

  const setTab = useCallback((key) => setValues({ tab: key, page: 1 }, { replace: false }), [setValues]);

  const committedText = useMemo(
    () => Object.fromEntries(TEXT_KEYS.map((key) => [key, committed[key]])),
    [committed]
  );

  const commitText = useCallback((patch) => setValues({ ...patch, page: 1 }), [setValues]);

  const [textDrafts, setTextDraft] = useUrlDraftMap(committedText, commitText, 400);

  const filters = useMemo(() => ({ ...committed, ...textDrafts }), [committed, textDrafts]);

  const setFilter = useCallback(
    (name, value) => (TEXT_KEYS.includes(name) ? setTextDraft(name, value) : commitFilter(name, value)),
    [setTextDraft, commitFilter]
  );

  const dateError = dateRangeError(committed.fromDate, committed.toDate);

  const advertisementIdError =
    filters.advertisementId && !isUuid(filters.advertisementId)
      ? "أدخل معرّف إعلان صالحًا (UUID)."
      : null;

  /* An invalid range or id is never sent: the server would reject the first
     and silently ignore the second, answering a different question. */
  const blockedReason = dateError || (committed.advertisementId && !isUuid(committed.advertisementId) ? advertisementIdError : null);

  const queryFilters = useMemo(
    () => ({
      status: committed.status,
      type: committed.type,
      categoryId: committed.categoryId,
      userId: committed.userId,
      advertisementId: committed.advertisementId,
      fromDate: committed.fromDate,
      toDate: committed.toDate,
      pageIndex,
      pageSize: AD_PAYMENT_PAGE_SIZES.includes(pageSize) ? pageSize : AD_PAYMENT_DEFAULT_PAGE_SIZE,
    }),
    [committed, pageIndex, pageSize]
  );

  const { modules, categories, metadataQuery } = useAdminAdsMetadata({ enabled: canView });

  const typeOptions = useMemo(() => {
    const byId = new Map(modules.map((module) => [Number(module.id), module]));

    return AD_PAYMENT_TYPE_VALUES.map((id) => {
      const module = byId.get(id);

      return { id, name: module?.arabicName || module?.name || `#${id}` };
    });
  }, [modules]);

  const categoryOptions = useMemo(
    () => (categories ?? []).map((category) => ({ id: category.id, name: category.name })),
    [categories]
  );

  /* Status names are the server's, learned from the rows it returns; a value
     not seen yet shows as its number rather than a guessed name. */
  const [statusNames, setStatusNames] = useState(() => new Map());

  const learnStatuses = useCallback((rows) => {
    const found = rows.filter((row) => row?.paymentStatus != null && row?.paymentStatusName);

    if (!found.length) return;

    setStatusNames((current) => {
      if (found.every((row) => current.get(Number(row.paymentStatus)) === row.paymentStatusName)) return current;

      const next = new Map(current);

      found.forEach((row) => next.set(Number(row.paymentStatus), row.paymentStatusName));

      return next;
    });
  }, []);

  const statusOptions = AD_PAYMENT_STATUS_VALUES.map((id) => ({
    id,
    name: statusNames.get(id) ?? `الحالة ${id}`,
  }));

  /* Details: the id travels, the record is read from the server. */
  const [selected, setSelected] = useState(null);

  const open = useCallback((id, source) => setSelected(id ? { id, source: source ?? "submissions" } : null), []);

  const openFromLink = useCallback((id) => open(id, "submissions"), [open]);

  const { clearDeepLink } = useAdminRecordDeepLink({ listPath: ROUTE, open: openFromLink });

  const [review, setReview] = useState(null);

  /** A dialog (the receipt) open on top of the details sheet. */
  const [overlayOpen, setOverlayOpen] = useState(false);

  const closeDetails = useCallback(() => {
    setSelected(null);

    setOverlayOpen(false);

    clearDeepLink?.();
  }, [clearDeepLink]);

  const detailsQuery = useAdPaymentSubmission({ id: selected?.id, enabled: canView });

  const listProps = {
    queryFilters,
    enabled: canView && !blockedReason,
    blockedReason,
    hasActiveFilters,
    resetFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    onRows: learnStatuses,
  };

  return (
    <>
      <Seo title="مدفوعات الإعلانات | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <Wallet size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">مدفوعات الإعلانات</h1>
              <p className="mt-0.5 text-[13px] text-muted">إثباتات الدفع المرسلة وسجلها وإعدادات الدفع.</p>
            </div>
          </div>
        </header>

        {!permissionsSettled ? (
          <TableSkeleton />
        ) : !canView ? (
          <ForbiddenState />
        ) : (
          <>
            <div role="tablist" aria-label="أقسام المدفوعات" className="flex flex-wrap gap-2 border-b border-line pb-3">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  onClick={() => setTab(item.key)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold ring-1 ring-inset transition-colors duration-200 ${
                    tab === item.key
                      ? "bg-brand-900 text-white ring-brand-900"
                      : "bg-surface text-ink-soft ring-line-strong hover:bg-brand-50"
                  }`}
                >
                  <item.icon size={15} aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-5">
              {tab === "settings" ? (
                <AdPaymentSettingsPanel canEdit={canEdit} />
              ) : (
                <>
                  <div className="flex justify-end">
                    <RefreshButton key={tab} kind={tab} queryFilters={queryFilters} enabled={canView && !blockedReason} />
                  </div>

                  <AdPaymentFilters
                    idPrefix={`ad-payment-${tab}`}
                    filters={filters}
                    setFilter={setFilter}
                    resetFilters={resetFilters}
                    hasActiveFilters={hasActiveFilters}
                    statusOptions={statusOptions}
                    typeOptions={typeOptions}
                    categoryOptions={categoryOptions}
                    metadataLoading={metadataQuery?.isLoading}
                    dateError={dateError}
                    advertisementIdError={advertisementIdError}
                  />

                  <PaymentsList
                    key={tab}
                    kind={tab}
                    {...listProps}
                    onOpen={(id) => open(id, tab)}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        /* Held while a review dialog is on top, so one Escape never closes both. */
        onClose={review || overlayOpen ? undefined : closeDetails}
        title={selected?.source === "history" ? "تفاصيل الدفع (سجل)" : "تفاصيل طلب الدفع"}
        size="lg"
      >
        {selected && (
          <AdPaymentDetails
            query={detailsQuery}
            canApprove={canApprove}
            readOnly={selected.source === "history"}
            onReview={(action, submission) => setReview({ action, submission })}
            onOverlayChange={setOverlayOpen}
          />
        )}
      </Modal>

      {review && (
        <AdPaymentReviewDialog
          key={`${review.action}-${review.submission.paymentSubmissionId}`}
          action={review.action}
          submission={review.submission}
          onClose={() => setReview(null)}
        />
      )}
    </>
  );
}

/** Refetches the list on screen; shares its cache entry, so no second request. */
function RefreshButton({ kind, queryFilters, enabled }) {
  const useList = kind === "history" ? useAdPaymentHistory : useAdPaymentSubmissions;

  const query = useList({ filters: queryFilters, enabled });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => query.refetch()}
      loading={query.isFetching && !query.isLoading}
      disabled={!enabled}
    >
      <RotateCw size={15} />
      تحديث
    </Button>
  );
}
