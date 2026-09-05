import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, RotateCw, ShieldCheck, UserCog } from "lucide-react";

import Seo from "../../../components/Seo";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import BackButton from "../../../components/ui/BackButton";
import AdminPagination from "../../../components/admin/AdminPagination";
import { AdminAccountsProvider } from "../../../context/AdminAccountsContext";
import useAdminAccountsContext from "../../../hooks/admin/useAdminAccountsContext";
import useAdminRecordDeepLink from "../../../hooks/admin/useAdminRecordDeepLink";
import {
  useAdminAccountDetails,
  useAdminAccounts,
  useDeleteAdminAccount,
  useUpdateAdminAccountStatus,
} from "../../../hooks/admin/useAdminAccounts";
import AdminAccountsFilters from "./components/AdminAccountsFilters";
import AdminAccountsTable from "./components/AdminAccountsTable";
import AdminAccountDetails from "./components/AdminAccountDetails";
import AdminAccountStatusDialog from "./components/AdminAccountStatusDialog";
import { PAGE_SIZE_OPTIONS } from "./accountsConstants";
import { formatNumber } from "../../../utils/format";

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
          : "إدارة حسابات المسؤولين مخصّصة للمسؤول الأعلى فقط."}
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
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>

          <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />
          <Skeleton className="hidden h-3 w-24 shrink-0 md:block" />
        </div>
      ))}
    </div>
  );
}

function AdminAccountsDashboard() {
  const {
    queryFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    hasActiveFilters,
    resetFilters,
    selectedAccount,
    openAccount,
    closeAccount,
    dialog,
    openStatusDialog,
    openDeleteDialog,
    closeDialog,
  } = useAdminAccountsContext();

  const navigate = useNavigate();

  const listQuery = useAdminAccounts({ filters: queryFilters });

  const detailsQuery = useAdminAccountDetails({ id: selectedAccount?.id });

  const openAccountById = useCallback(
    (id) => openAccount({ id }),
    [openAccount]
  );

  const { clearDeepLink } = useAdminRecordDeepLink({
    listPath: "/admin/accounts",
    open: openAccountById,
  });

  const onCloseAccount = useCallback(() => {
    closeAccount();

    clearDeepLink?.();
  }, [closeAccount, clearDeepLink]);

  const status = useUpdateAdminAccountStatus({ onDone: closeDialog });

  const remove = useDeleteAdminAccount({
    onDone: () => {
      closeDialog();

      closeAccount();
    },
  });

  const result = listQuery.data?.data;

  const accounts = result?.items ?? [];

  const errorStatus = listQuery.error?.response?.status;

  const isAuthError = errorStatus === 401 || errorStatus === 403;

  const errorCopy =
    errorStatus === 429
      ? {
          title: "عدد كبير من الطلبات",
          description:
            "تم تجاوز الحد المسموح مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
        }
      : errorStatus >= 500
      ? {
          title: "خطأ في الخادم",
          description: "تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.",
        }
      : {
          title: "تعذّر تحميل حسابات المسؤولين",
          description: "حدث خطأ أثناء جلب القائمة. حاول مرة أخرى.",
        };

  /* Every dialog acts on the freshest copy: the detail response once it has
     landed, the row until then — both carry the fields they read. */
  const target = detailsQuery.data?.data ?? selectedAccount;

  return (
    <>
      <Seo title="حسابات المسؤولين | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <UserCog size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                حسابات المسؤولين
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {typeof result?.totalCount === "number"
                  ? `${formatNumber(result.totalCount)} حساب مسؤول.`
                  : "إدارة الحسابات والصلاحيات."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => listQuery.refetch()}
              loading={listQuery.isFetching && !listQuery.isLoading}
            >
              <RotateCw size={15} />
              تحديث
            </Button>

            {/* Creation is its own page — the permission catalogue needs the
                room a dialog cannot give it. */}
            <Button as={Link} to="/admin/accounts/create" size="sm">
              <Plus size={16} />
              إضافة مسؤول
            </Button>
          </div>
        </header>

        <AdminAccountsFilters />

        <div className="mt-5">
          {listQuery.isLoading ? (
            <TableSkeleton />
          ) : isAuthError ? (
            <AuthState status={errorStatus} />
          ) : listQuery.isError ? (
            <ErrorState
              title={errorCopy.title}
              description={errorCopy.description}
              onRetry={listQuery.refetch}
            />
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="لا يوجد مسؤولون مطابقون"
              description={
                hasActiveFilters
                  ? "جرّب توسيع نطاق البحث أو مسح الفلاتر المطبّقة."
                  : "لم يُنشأ أي حساب مسؤول حتى الآن."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={resetFilters}>
                    مسح الفلاتر
                  </Button>
                ) : (
                  <Button as={Link} to="/admin/accounts/create">
                    <Plus size={16} />
                    إضافة مسؤول
                  </Button>
                )
              }
            />
          ) : (
            <div
              className={`transition-opacity duration-200 ${
                listQuery.isFetching ? "opacity-60" : ""
              }`}
            >
              <AdminAccountsTable accounts={accounts} onOpen={openAccount} />

              <div className="mt-4">
                <AdminPagination
                  result={result}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  itemNoun="حساب"
                  onPageChange={setPageIndex}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminAccountDetails
        /* Hidden rather than unmounted while a dialog is up, so the sheet is
           still there behind it when the dialog closes. */
        open={Boolean(selectedAccount) && !dialog}
        onClose={onCloseAccount}
        query={detailsQuery}
        onChangeStatus={openStatusDialog}
        /* Grants are edited on their own page now rather than in a dialog over
           this sheet. */
        onEditPermissions={(account) =>
          navigate(`/admin/accounts/${account.id}/permissions`)
        }
        onDelete={openDeleteDialog}
      />

      <AdminAccountStatusDialog
        open={dialog === "status"}
        account={target}
        onClose={closeDialog}
        mutation={status.mutation}
        onSubmit={status.submit}
      />

      <ConfirmDialog
        open={dialog === "delete"}
        title="حذف حساب المسؤول"
        description={
          target
            ? `سيُحذف حساب «${
                target.name || target.userName
              }» نهائيًا مع كل صلاحياته. لا يمكن التراجع عن هذا الإجراء.`
            : ""
        }
        confirmLabel="حذف نهائيًا"
        tone="danger"
        loading={remove.mutation.isPending}
        onConfirm={() => remove.submit(target.id)}
        onClose={closeDialog}
      />
    </>
  );
}

export default function AdminAccountsPage() {
  return (
    <AdminAccountsProvider>
      <AdminAccountsDashboard />
    </AdminAccountsProvider>
  );
}
