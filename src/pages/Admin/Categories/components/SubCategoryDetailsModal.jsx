import { Trash2 } from "lucide-react";

import Button from "../../../../components/ui/Button";
import ErrorState from "../../../../components/ui/ErrorState";
import Modal from "../../../../components/ui/Modal";
import Skeleton from "../../../../components/ui/Skeleton";
import Switch from "../../../../components/ui/Switch";
import { useAdminSubCategory } from "../../../../hooks/admin/useAdminCategories";
import { apiError } from "../../../Profile/profileCache";
import { formatNumber } from "../../../../utils/format";
import { ActiveBadge, SystemBadge } from "./CategoryBadges";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="min-w-0 text-end text-[13.5px] font-medium text-ink">
        {children ?? "—"}
      </dd>
    </div>
  );
}

/* What the details GET can answer besides the record itself. A 404 is the
   server's own sentence; the rest are fixed, so a 5xx body never shows. */
function loadError(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return { title: "انتهت صلاحية جلستك", description: "سجّل الدخول مرة أخرى للمتابعة.", retry: false };
  }

  if (status === 403) {
    return { title: "لا تملك صلاحية عرض الأقسام", description: "تواصل مع المشرف العام لمنحك صلاحية العرض.", retry: false };
  }

  if (status === 404) {
    return { title: "القسم الفرعي غير موجود", description: apiError(error, "ربما حُذف بالفعل. حدّث القائمة."), retry: false };
  }

  if (status === 400) {
    return { title: "طلب غير صالح", description: apiError(error, "تعذّر قراءة هذا القسم الفرعي."), retry: false };
  }

  if (status === 429) {
    return { title: "عدد كبير من الطلبات", description: "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة.", retry: true };
  }

  return { title: "تعذّر تحميل القسم الفرعي", description: "حدث خطأ أثناء جلب البيانات. حاول مرة أخرى.", retry: true };
}

export default function SubCategoryDetailsModal({
  subCategory,
  onClose,
  canManage,
  canDelete,
  onToggle,
  toggleBusy,
  onDelete,
}) {
  const id = subCategory?.id;

  const query = useAdminSubCategory({ id });

  const details = query.data?.data;

  // The row the list knew, until the server's own answer arrives.
  const title = details?.nameAr || subCategory?.nameAr || "القسم الفرعي";

  const error = query.isError ? loadError(query.error) : null;

  return (
    <Modal
      open={Boolean(subCategory)}
      onClose={onClose}
      title={title}
      description={details?.categoryNameAr || subCategory?.categoryNameAr}
      footer={
        // Only beside a record that just read back: after a failed read
        // (a 404 above all) the cached copy is not something to act on.
        details && !error && (canManage || canDelete) ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {canManage ? (
              <div className="flex items-center gap-3 text-[13.5px] font-medium text-ink">
                <Switch
                  checked={Boolean(details.isActive)}
                  busy={toggleBusy}
                  onChange={(next) => onToggle(details, next)}
                  label={`تفعيل ${details.nameAr}`}
                />
                {details.isActive ? "مفعّل" : "معطّل"}
              </div>
            ) : (
              <span />
            )}

            {canDelete && (
              <Button
                variant="danger-ghost"
                size="sm"
                onClick={() => onDelete(details)}
                disabled={toggleBusy}
              >
                <Trash2 size={15} />
                حذف
              </Button>
            )}
          </div>
        ) : null
      }
    >
      {query.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-6 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title={error.title}
          description={error.description}
          onRetry={error.retry ? query.refetch : undefined}
        />
      ) : details ? (
        <div className={query.isFetching ? "opacity-70 transition-opacity" : ""}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ActiveBadge active={details.isActive} />
            {details.isSystem && <SystemBadge />}
          </div>

          <dl>
            <Row label="رقم القسم الفرعي">
              <span className="tnum">{formatNumber(details.id)}</span>
            </Row>
            <Row label="الاسم بالعربية">{details.nameAr || null}</Row>
            <Row label="الاسم بالإنجليزية">
              {details.nameEn ? <span dir="ltr">{details.nameEn}</span> : null}
            </Row>
            <Row label="القسم الرئيسي">
              {details.categoryNameAr
                ? `${details.categoryNameAr} (${formatNumber(details.categoryId)})`
                : null}
            </Row>
            <Row label="عدد الإعلانات">
              {typeof details.adsCount === "number" ? (
                <span className="tnum">{formatNumber(details.adsCount)}</span>
              ) : null}
            </Row>
            <Row label="ترتيب العرض">
              {typeof details.sortOrder === "number" ? (
                <span className="tnum">{formatNumber(details.sortOrder)}</span>
              ) : null}
            </Row>
            <Row label="الأيقونة">
              {details.icon ? <span dir="ltr">{details.icon}</span> : null}
            </Row>
          </dl>

          {details.isSystem && (
            <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-[12.5px] leading-6 text-muted">
              قسم أساسي في النظام. قرار السماح بحذفه أو تعطيله يعود للخادم، وأي رفض يظهر بسببه.
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
