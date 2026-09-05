import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Crown, KeyRound, ShieldCheck } from "lucide-react";

import Seo from "../../../components/Seo";
import Button from "../../../components/ui/Button";
import Skeleton from "../../../components/ui/Skeleton";
import ErrorState from "../../../components/ui/ErrorState";
import EmptyState from "../../../components/ui/EmptyState";
import BackButton from "../../../components/ui/BackButton";
import SettingsSection from "../Settings/components/SettingsSection";
import PagePermissionsPicker from "./components/PagePermissionsPicker";
import { useAdminPermissionPages } from "../../../hooks/admin/useAdminPermissions";
import {
  useAdminAccountDetails,
  useUpdateAdminAccountPermissions,
} from "../../../hooks/admin/useAdminAccounts";
import { groupPages, toSelectionMap } from "../../../utils/adminPermissions";
import { adminAccountPages } from "../../../utils/adminAccountPages";
import { accountStatusTone, initialsOf } from "./accountsConstants";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import { formatNumber } from "../../../utils/format";

const LIST_PATH = "/admin/accounts";

/** The editor itself, mounted only when there is a real account to seed from. */
function PermissionsEditor({ account, onDone }) {
  const { pages: catalogue, pagesQuery } = useAdminPermissionPages();

  /* The ten pages these screens manage — see `utils/adminAccountPages`. */
  const pages = useMemo(() => adminAccountPages(catalogue), [catalogue]);

  const groups = useMemo(() => groupPages(pages), [pages]);

  const initial = useMemo(
    () => adminAccountPages(toSelectionMapEntries(account?.pages)),
    [account]
  );

  const [selection, setSelection] = useState(() => toSelectionFrom(initial));

  const { mutation, submit } = useUpdateAdminAccountPermissions({
    onDone,
  });

  const totals = useMemo(() => {
    const granted = Object.values(selection).filter(
      (set) => set && set.size > 0
    );

    return {
      pages: granted.length,
      permissions: granted.reduce((sum, set) => sum + set.size, 0),
    };
  }, [selection]);

  return (
    <>
      <SettingsSection
        icon={KeyRound}
        title="الصفحات والصلاحيات"
        description="سيحلّ ما تختاره هنا محل الصلاحيات الحالية بالكامل."
        action={
          totals.pages > 0 ? (
            <span className="tnum rounded-full bg-brand-900 px-2.5 py-1 text-[11.5px] font-bold text-white">
              {formatNumber(totals.pages)} / {formatNumber(pages.length)}
            </span>
          ) : null
        }
      >
        {account.isSuperAdmin && (
          <p className="mb-4 flex items-start gap-2 rounded-2xl border border-gold-200 bg-gold-50/60 p-3.5 text-[12.5px] leading-6 text-gold-700">
            <Crown size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            هذا حساب مسؤول أعلى. ما يقبله الخادم من تغييرات على صلاحياته هو
            قراره، وستظهر رسالته كما هي إذا رفض الطلب.
          </p>
        )}

        {totals.pages === 0 && !pagesQuery.isLoading && !pagesQuery.isError && (
          <p className="mb-4 flex items-start gap-2 rounded-2xl border border-dashed border-line-strong bg-canvas p-3.5 text-[12.5px] leading-6 text-muted">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            حفظ القائمة فارغة يعني منع هذا الحساب من كل الصفحات.
          </p>
        )}

        <PagePermissionsPicker
          pages={pages}
          groups={groups}
          selection={selection}
          onChange={setSelection}
          disabled={mutation.isPending}
          query={pagesQuery}
          stickyToolbar={false}
        />
      </SettingsSection>

      {/* The action bar, over the bottom of the page — the same one the create
          screen and the settings screen use. `bottom-16` clears the mobile tab
          bar. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 px-4 pb-3 safe-bottom lg:bottom-0 lg:pb-5">
        <div className="pointer-events-auto mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-strong bg-surface/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="tnum flex items-center gap-2 text-[13px] font-medium text-ink-soft">
            <ShieldCheck size={16} aria-hidden="true" className="text-brand-400" />
            {formatNumber(totals.pages)} صفحة · {formatNumber(totals.permissions)}{" "}
            صلاحية
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={mutation.isPending}
              onClick={onDone}
            >
              إلغاء
            </Button>

            <Button
              type="button"
              size="sm"
              loading={mutation.isPending}
              disabled={pagesQuery.isLoading || pagesQuery.isError}
              onClick={() => submit({ id: account.id, pages: selection })}
            >
              <KeyRound size={15} />
              حفظ الصلاحيات
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* `toSelectionMap` returns a `{ pageKey: Set }` map; these two keep the filter
   working on it without teaching `adminAccountPages` a second shape. */
function toSelectionMapEntries(pages) {
  return Object.entries(toSelectionMap(pages)).map(([pageKey, permissions]) => ({
    pageKey,
    permissions,
  }));
}

function toSelectionFrom(entries) {
  return Object.fromEntries(
    entries.map(({ pageKey, permissions }) => [pageKey, permissions])
  );
}

/** The account's identity, above the editor. */
function AccountHeader({ account }) {
  const image = resolveMediaUrl(account.image);

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xs">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-900 text-sm font-bold text-gold-300">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          initialsOf(account.name, account.userName)
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-bold text-ink">
          {account.name || account.userName || "—"}
        </p>

        <p dir="ltr" className="truncate text-[12px] text-muted">
          @{account.userName}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold ring-1 ring-inset ${accountStatusTone(
          account.isActive
        )}`}
      >
        {account.statusName || (account.isActive ? "فعال" : "معطّل")}
      </span>
    </div>
  );
}

export default function AdminAccountPermissionsPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const detailsQuery = useAdminAccountDetails({ id });

  const account = detailsQuery.data?.data;

  const status = detailsQuery.error?.response?.status;

  /* Back to the account's own sheet, which is where this was opened from. */
  const backToAccount = () => navigate(`${LIST_PATH}/${id}`);

  return (
    <>
      <Seo title="صلاحيات المسؤول | لوحة التحكم" robots="noindex, nofollow" />

      {/* `pb-40` clears the action bar, which is fixed over the page bottom. */}
      <div className="mx-auto max-w-[1000px] px-4 py-6 pb-40 sm:px-6 lg:px-8 lg:py-10">
        <BackButton />

        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
            <KeyRound size={21} strokeWidth={2} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              صلاحيات المسؤول
            </h1>

            <p className="mt-0.5 text-[13px] text-muted">
              حدِّد الصفحات التي يصل إليها هذا المسؤول والصلاحيات على كل صفحة.
            </p>
          </div>
        </header>

        {detailsQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : status === 401 || status === 403 ? (
          <EmptyState
            icon={ShieldCheck}
            title="لا تملك صلاحية الوصول"
            description="إدارة صلاحيات المسؤولين مخصّصة للمسؤول العام."
          />
        ) : detailsQuery.isError ? (
          <ErrorState
            title="تعذّر تحميل الحساب"
            description="حدث خطأ أثناء جلب بيانات هذا المسؤول. حاول مرة أخرى."
            onRetry={detailsQuery.refetch}
          />
        ) : !account ? null : (
          <>
            <AccountHeader account={account} />

            {/* Keyed on the account so navigating between two accounts' pages
                reseeds the picker rather than carrying the first one's set. */}
            <PermissionsEditor
              key={account.id}
              account={account}
              onDone={backToAccount}
            />
          </>
        )}
      </div>
    </>
  );
}
