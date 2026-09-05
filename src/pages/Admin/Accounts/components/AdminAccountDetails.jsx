import { useMemo } from "react";
import {
  AtSign,
  CalendarDays,
  Crown,
  KeyRound,
  LayoutGrid,
  Mail,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import { accountStatusTone, initialsOf } from "../accountsConstants";
import { formatDateTime, formatNumber } from "../../../../utils/format";
import {
  groupPages,
  normalizePage,
  pageLabel,
} from "../../../../utils/adminPermissions";

function Row({ label, value, dir, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>

      <dd
        dir={dir}
        className={`min-w-0 break-words text-end text-[13.5px] font-medium text-ink-soft ${
          mono ? "tnum" : ""
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-muted">
          {Icon && <Icon size={15} strokeWidth={2.1} aria-hidden="true" />}
          {title}
        </h3>

        {action}
      </div>

      {children}
    </section>
  );
}

function GrantedPage({ page }) {
  return (
    <li className="rounded-2xl border border-line bg-canvas p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {/* `icon` names an icon from Lucide's set, chosen for the API's own
              console — a neutral mark stands in rather than the raw string.
              Same reasoning as `PagePermissionsPicker`'s `PageMark`. */}
          <LayoutGrid
            size={15}
            strokeWidth={2}
            aria-hidden="true"
            title={page.icon ?? undefined}
            className="mt-0.5 shrink-0 text-brand-400"
          />

          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold text-ink">
              {pageLabel(page)}
            </p>

            {page.route && (
              <p
                dir="ltr"
                className="truncate text-start text-[11.5px] text-muted"
              >
                {page.route}
              </p>
            )}
          </div>
        </div>

        <span className="tnum shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-muted ring-1 ring-inset ring-line">
          {formatNumber(page.permissions.length)}
        </span>
      </div>

      {page.permissions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {page.permissions.map((permission) => (
            <span
              key={permission.value}
              className="inline-flex items-center rounded-lg bg-brand-50 px-2 py-1 text-[11.5px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100"
            >
              {permission.label}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

export default function AdminAccountDetails({
  open,
  onClose,
  query,
  onChangeStatus,
  onEditPermissions,
  onDelete,
}) {
  const account = query.data?.data;

  const groups = useMemo(() => {
    const pages = (Array.isArray(account?.pages) ? account.pages : [])
      .map(normalizePage)
      .filter(Boolean);

    return groupPages(pages);
  }, [account]);

  const totalPermissions = groups.reduce(
    (sum, group) =>
      sum + group.pages.reduce((count, page) => count + page.permissions.length, 0),
    0
  );

  const totalPages = groups.reduce((sum, group) => sum + group.pages.length, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account?.name || account?.userName || "تفاصيل المسؤول"}
      description={account ? `@${account.userName}` : undefined}
      size="lg"
      footer={
        account && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="danger-ghost"
              onClick={() => onDelete(account)}
            >
              <Trash2 size={15} />
              حذف
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onChangeStatus(account)}
            >
              <SlidersHorizontal size={15} />
              {account.isActive ? "تعطيل" : "تفعيل"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditPermissions(account)}
            >
              <KeyRound size={15} />
              الصلاحيات
            </Button>

          </div>
        )
      }
    >
      {query.isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />

            <div className="flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/4" />
            </div>
          </div>

          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : query.isError ? (
        <ErrorState
          title="تعذّر تحميل بيانات المسؤول"
          description="حدث خطأ أثناء جلب بيانات هذا الحساب. حاول مرة أخرى."
          onRetry={query.refetch}
        />
      ) : !account ? null : (
        <>
          {/* --------------------------- identity --------------------------- */}
          <div className="flex items-start gap-3.5">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-900 to-brand-700 text-lg font-bold text-gold-300"
            >
              {initialsOf(account.name, account.userName)}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] font-extrabold text-ink">
                {account.name || account.userName}
              </h2>

              <p dir="ltr" className="truncate text-start text-[12.5px] text-muted">
                @{account.userName}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${accountStatusTone(
                    account.isActive
                  )}`}
                >
                  {account.statusName ||
                    (account.isActive ? "مفعّل" : "معطّل")}
                </span>

                {account.isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-700 ring-1 ring-inset ring-gold-200">
                    <Crown size={12} aria-hidden="true" />
                    مسؤول أعلى
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
                    <ShieldCheck size={12} aria-hidden="true" />
                    مسؤول
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ------------------------ basic information ---------------------- */}
          <Section title="البيانات الأساسية" icon={UserRound}>
            <dl className="rounded-2xl border border-line bg-canvas px-3.5 py-1">
              <Row label="الاسم" value={account.name} />

              <Row
                label="اسم المستخدم"
                dir="ltr"
                value={account.userName ? `@${account.userName}` : null}
              />

              <Row label="البريد الإلكتروني" dir="ltr" value={account.email} />

              <Row label="الهاتف" dir="ltr" mono value={account.phone} />

              <Row
                label="تاريخ الإنشاء"
                mono
                value={formatDateTime(account.createdAt)}
              />
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              {account.email && (
                <a
                  href={`mailto:${account.email}`}
                  className="inline-flex items-center gap-1.5 text-[12.5px] text-brand-600 hover:text-brand-800"
                >
                  <Mail size={13} aria-hidden="true" />
                  مراسلة
                </a>
              )}

              {account.phone && (
                <a
                  href={`tel:${account.phone}`}
                  className="inline-flex items-center gap-1.5 text-[12.5px] text-brand-600 hover:text-brand-800"
                >
                  <Phone size={13} aria-hidden="true" />
                  اتصال
                </a>
              )}
            </div>
          </Section>

          {/* --------------------- pages and permissions --------------------- */}
          <Section
            title="الصفحات والصلاحيات"
            icon={KeyRound}
            action={
              totalPages > 0 && (
                <span className="tnum text-[12px] text-muted">
                  {formatNumber(totalPages)} صفحة ·{" "}
                  {formatNumber(totalPermissions)} صلاحية
                </span>
              )
            }
          >
            {account.isSuperAdmin && totalPages === 0 ? (
              <p className="rounded-2xl border border-dashed border-gold-200 bg-gold-50/60 p-4 text-[13px] leading-7 text-gold-700">
                <Crown
                  size={14}
                  aria-hidden="true"
                  className="me-1.5 inline"
                />
                حساب مسؤول أعلى — لم يُرجِع الخادم صفحات محدَّدة لهذا الحساب.
              </p>
            ) : totalPages === 0 ? (
              <p className="rounded-2xl border border-dashed border-line-strong bg-canvas p-4 text-center text-[13px] leading-7 text-muted">
                لم تُمنح لهذا الحساب أي صفحات بعد.
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.group ?? "__ungrouped"}>
                    {group.group && (
                      <h4 className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-muted">
                        {group.group}
                      </h4>
                    )}

                    <ul className="space-y-2.5">
                      {group.pages.map((page) => (
                        <GrantedPage key={page.pageKey} page={page} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <p className="mt-5 flex items-center gap-1.5 text-[11.5px] text-muted">
            <AtSign size={12} aria-hidden="true" />
            اسم المستخدم يُحدَّد عند الإنشاء ولا يمكن تعديله لاحقًا.
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
            <CalendarDays size={12} aria-hidden="true" />
            جميع الصلاحيات تُطبَّق من الخادم عند كل طلب.
          </p>
        </>
      )}
    </Modal>
  );
}
