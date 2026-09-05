import { useCallback } from "react";
import Seo from "../../../components/Seo";
import { RotateCw, ShieldCheck, UsersRound } from "lucide-react";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import AdminPagination from "../../../components/admin/AdminPagination";
import { AdminUsersProvider } from "../../../context/AdminUsersContext";
import useAdminUsersContext from "../../../hooks/admin/useAdminUsersContext";
import useAdminRecordDeepLink from "../../../hooks/admin/useAdminRecordDeepLink";
import {
  useAdminUserDetails,
  useAdminUsers,
  useUpdateUserStatus,
} from "../../../hooks/admin/useAdminUsers";
import AdminUsersFilters from "./components/AdminUsersFilters";
import UsersExportMenu from "./components/UsersExportMenu";
import AdminUsersTable from "./components/AdminUsersTable";
import AdminUserDetails from "./components/AdminUserDetails";
import UserStatusDialog from "./components/UserStatusDialog";
import { PAGE_SIZE_OPTIONS } from "./usersConstants";
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
          : "إدارة المستخدمين مخصّصة لحسابات الإدارة فقط."}
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

function AdminUsersDashboard() {
  const {
    queryFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    hasActiveFilters,
    resetFilters,
    selectedUser,
    openUser,
    closeUser,
    isStatusOpen,
    openStatusDialog,
    closeStatusDialog,
  } = useAdminUsersContext();

  const listQuery = useAdminUsers({ filters: queryFilters });

  const detailsQuery = useAdminUserDetails({ id: selectedUser?.id });

  const openUserById = useCallback((id) => openUser({ id }), [openUser]);

  const { clearDeepLink } = useAdminRecordDeepLink({
    listPath: "/admin/users",
    open: openUserById,
  });

  /* Closing a sheet a deep link opened also leaves the deep link, so the
     address goes back to describing the list that is on screen. */
  const onCloseUser = useCallback(() => {
    closeUser();

    clearDeepLink?.();
  }, [closeUser, clearDeepLink]);

  const { updateStatusMutation, submit } = useUpdateUserStatus({
    onDone: closeStatusDialog,
  });

  const result = listQuery.data?.data;

  const users = result?.items ?? [];

  const status = listQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

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
          title: "تعذّر تحميل المستخدمين",
          description: "حدث خطأ أثناء جلب قائمة المستخدمين. حاول مرة أخرى.",
        };

  /* The dialog acts on the freshest copy: the detail response once it has
     landed, the row until then — both carry `id`, `status` and `statusName`. */
  const statusTarget = detailsQuery.data?.data ?? selectedUser;

  return (
    <>
      <Seo title="إدارة المستخدمين | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <UsersRound size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                إدارة المستخدمين
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {typeof result?.totalCount === "number"
                  ? `${formatNumber(result.totalCount)} حساب مسجّل.`
                  : "عرض الحسابات وتعديل حالتها."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Exports the rows already on screen — this pagination page, as
                the filters and the search left it. No request of its own. */}
            <UsersExportMenu
              users={users}
              subtitle={`صفحة ${formatNumber(pageIndex)} — ${formatNumber(users.length)} حساب`}
            />

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

        <AdminUsersFilters />

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
          ) : users.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="لا يوجد مستخدمون مطابقون"
              description={
                hasActiveFilters
                  ? "جرّب توسيع نطاق البحث أو مسح الفلاتر المطبّقة."
                  : "لم يُسجَّل أي حساب حتى الآن."
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
              <AdminUsersTable users={users} onOpen={openUser} />

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

      <AdminUserDetails
        /* Hidden rather than unmounted while the status dialog is up, so the
           sheet is still there behind it when the dialog closes. */
        open={Boolean(selectedUser) && !isStatusOpen}
        onClose={onCloseUser}
        query={detailsQuery}
        onChangeStatus={openStatusDialog}
      />

      <UserStatusDialog
        open={isStatusOpen}
        user={statusTarget}
        onClose={closeStatusDialog}
        mutation={updateStatusMutation}
        onSubmit={submit}
      />
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminUsersProvider>
      <AdminUsersDashboard />
    </AdminUsersProvider>
  );
}
