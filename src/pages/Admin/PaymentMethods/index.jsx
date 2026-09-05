import { useState } from "react";
import Seo from "../../../components/Seo";
import {
  CreditCard,
  Pencil,
  Plus,
  RotateCw,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";

import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import Switch from "../../../components/ui/Switch";
import PaymentMethodInfo from "../../../components/payments/PaymentMethodInfo";
import PaymentMethodFormModal from "./components/PaymentMethodFormModal";
import {
  useAdminPaymentMethods,
  useDeletePaymentMethod,
  useTogglePaymentMethodStatus,
} from "../../../hooks/admin/useAdminPaymentMethods";
import { formatNumber } from "../../../utils/format";
import BackButton from "../../../components/ui/BackButton";

function ForbiddenState({ status }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">
        {status === 401
          ? "انتهت صلاحية جلستك"
          : "لا تملك صلاحية إدارة طرق الدفع"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        {status === 401
          ? "سجّل الدخول مرة أخرى للمتابعة."
          : "هذه الصفحة مخصّصة لحسابات الإدارة فقط."}
      </p>
    </div>
  );
}

function MethodCard({ method, onEdit, onDelete, onToggle, toggling }) {
  return (
    <li className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-bold text-ink">
              {method.arabicName || method.name}
            </h3>

            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                method.isActive
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-slate-100 text-slate-600 ring-slate-300"
              }`}
            >
              {method.isActive ? "مفعّلة" : "معطّلة"}
            </span>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            {method.name && <span dir="ltr">{method.name}</span>}

            {method.typeName && (
              <>
                <span aria-hidden="true">·</span>
                <span>{method.typeName}</span>
              </>
            )}

            <span aria-hidden="true">·</span>

            <span className="tnum">
              ترتيب {formatNumber(method.displayOrder ?? 0)}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Switch
            checked={Boolean(method.isActive)}
            busy={toggling}
            onChange={(next) => onToggle(method, next)}
            label={`تفعيل ${method.arabicName || method.name}`}
          />

          <Button variant="ghost" size="sm" onClick={() => onEdit(method)}>
            <Pencil size={15} />
            تعديل
          </Button>

          <Button
            variant="danger-ghost"
            size="sm"
            onClick={() => onDelete(method)}
          >
            <Trash2 size={15} />
            حذف
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <PaymentMethodInfo method={method} />
      </div>
    </li>
  );
}

export default function AdminPaymentMethodsPage() {
  const { methodsQuery, methods } = useAdminPaymentMethods();

  const [formOpen, setFormOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);

  const toggle = useTogglePaymentMethodStatus();

  const deleteMethod = useDeletePaymentMethod({
    onDone: () => setPendingDelete(null),
  });

  const status = methodsQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  const openCreate = () => {
    setEditing(null);

    setFormOpen(true);
  };

  const openEdit = (method) => {
    setEditing(method);

    setFormOpen(true);
  };

  return (
    <>
      <Seo title="طرق الدفع | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1000px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <CreditCard size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                طرق الدفع
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {methods.length
                  ? `${formatNumber(methods.length)} طريقة — المفعّلة منها تظهر للمستخدمين.`
                  : "الطرق التي يمكن للمستخدمين التحويل إليها."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => methodsQuery.refetch()}
              loading={methodsQuery.isFetching && !methodsQuery.isLoading}
            >
              <RotateCw size={15} />
              تحديث
            </Button>

            <Button size="sm" onClick={openCreate}>
              <Plus size={16} />
              إضافة طريقة
            </Button>
          </div>
        </header>

        {methodsQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : isAuthError ? (
          <ForbiddenState status={status} />
        ) : methodsQuery.isError ? (
          <ErrorState
            title={
              status === 429 ? "عدد كبير من الطلبات" : "تعذّر تحميل طرق الدفع"
            }
            description={
              status === 429
                ? "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة."
                : "حدث خطأ أثناء جلب طرق الدفع. تحقّق من الاتصال وحاول مرة أخرى."
            }
            onRetry={methodsQuery.refetch}
          />
        ) : methods.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="لا توجد طرق دفع"
            description="أضف أول طريقة دفع ليتمكّن المستخدمون من إرسال مدفوعاتهم."
            action={
              <Button onClick={openCreate}>
                <Plus size={16} />
                إضافة طريقة
              </Button>
            }
          />
        ) : (
          <ul
            className={`space-y-4 transition-opacity duration-200 ${
              methodsQuery.isFetching ? "opacity-60" : ""
            }`}
          >
            {methods.map((method) => (
              <MethodCard
                key={method.id}
                method={method}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                onToggle={(target, isActive) =>
                  toggle.submit({ id: target.id, isActive })
                }
                toggling={toggle.pendingId === method.id}
              />
            ))}
          </ul>
        )}
      </div>

      <PaymentMethodFormModal
        open={formOpen}
        method={editing}
        onClose={() => {
          setFormOpen(false);

          setEditing(null);
        }}
      />

      {/* The row is only removed by re-reading the list. A 409 (the method is
          still referenced by payments) leaves it exactly where it was. */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="حذف طريقة الدفع"
        description={
          pendingDelete
            ? `سيتم حذف «${
                pendingDelete.arabicName || pendingDelete.name
              }» نهائيًا. لن يتمكّن المستخدمون من اختيارها بعد الآن.`
            : ""
        }
        confirmLabel="حذف"
        loading={deleteMethod.mutation.isPending}
        onConfirm={() => deleteMethod.submit(pendingDelete.id)}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
