import { useState } from "react";
import {
  Ban,
  Calendar,
  Check,
  ChevronDown,
  ExternalLink,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Image from "../../../../components/ui/Image";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import StatusBadge from "./StatusBadge";
import { formatDateTime, formatPrice } from "../../../../utils/format";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";

function Section({ title, icon: Icon, children }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-muted">
        {Icon && <Icon size={15} strokeWidth={2.1} aria-hidden="true" />}
        {title}
      </h3>

      {children}
    </section>
  );
}

function Row({ label, value, dir }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="min-w-0 max-w-[70%] break-words text-[13px] text-muted">
        {label}
      </dt>

      <dd
        dir={dir}
        className="min-w-0 text-end text-[13.5px] font-medium text-ink-soft"
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

/** Print whatever the field holds, guided by its declared `type`. */
function fieldText(field) {
  if (field?.displayValue) return field.displayValue;

  const value = field?.value;

  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "boolean") return value ? "نعم" : "لا";

  if (Array.isArray(value)) {
    return value.length ? value.map((entry) => String(entry)).join("، ") : null;
  }

  if (typeof value === "object") return JSON.stringify(value);

  if (field.type === "date" || field.type === "datetime") {
    return formatDateTime(value) || String(value);
  }

  return String(value);
}

export default function AdminAdDetails({ open, onClose, query, onAction }) {
  const [showRaw, setShowRaw] = useState(false);

  const ad = query.data?.data;

  const moderation = String(ad?.moderation?.status ?? "").toLowerCase();

  const fields = (ad?.fields ?? [])
    .map((field) => ({ ...field, text: fieldText(field) }))
    .filter((field) => field.text !== null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ad?.title || "تفاصيل الإعلان"}
      description={ad ? [ad.categoryName, ad.subCategoryName].filter(Boolean).join(" • ") : undefined}
      size="lg"
      footer={
        ad && (
          <div className="flex flex-wrap justify-end gap-2">
            {moderation !== "approved" && (
              <Button
                size="sm"
                onClick={() => onAction("approve", ad)}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
              >
                <Check size={16} />
                موافقة
              </Button>
            )}

            {moderation !== "rejected" && (
              <Button size="sm" variant="danger" onClick={() => onAction("reject", ad)}>
                <X size={16} />
                رفض
              </Button>
            )}

            {moderation === "approved" && (
              <Button size="sm" variant="outline" onClick={() => onAction("suspend", ad)}>
                <Ban size={16} />
                إيقاف
              </Button>
            )}

            <Button
              size="sm"
              variant="danger-ghost"
              onClick={() => onAction("delete", ad)}
            >
              <Trash2 size={16} />
              حذف
            </Button>
          </div>
        )
      }
    >
      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : query.isError ? (
        <ErrorState
          title="تعذّر تحميل تفاصيل الإعلان"
          description="حدث خطأ أثناء جلب بيانات الإعلان. حاول مرة أخرى."
          onRetry={query.refetch}
        />
      ) : !ad ? null : (
        <>
          {/* ------------------------- media ------------------------- */}
          {(ad.imageUrls?.length > 0 || ad.videoUrls?.length > 0) && (
            <Section title="الوسائط">
              {ad.imageUrls?.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {ad.imageUrls.map((url, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={resolveMediaUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden rounded-xl border border-line"
                    >
                      <Image
                        src={resolveMediaUrl(url)}
                        alt={`صورة ${index + 1}`}
                        ratio="aspect-[4/3]"
                      />
                    </a>
                  ))}
                </div>
              )}

              {ad.videoUrls?.length > 0 && (
                <ul className="mt-2.5 space-y-2">
                  {ad.videoUrls.map((url, index) => (
                    <li key={`${url}-${index}`}>
                      <a
                        href={resolveMediaUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-600 hover:text-brand-800"
                      >
                        <ExternalLink size={15} />
                        فيديو {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {/* ---------------------- basic + status ------------------- */}
          <Section title="بيانات الإعلان">
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge status={ad.status} />

              <StatusBadge
                status={ad.moderation?.status}
                label={ad.moderation?.statusName}
              />
            </div>

            <dl>
              <Row label="العنوان" value={ad.title} />
              <Row label="النوع" value={ad.typeName || ad.type} />
              <Row label="القسم" value={ad.categoryName} />
              <Row label="القسم الفرعي" value={ad.subCategoryName} />
              <Row label="السعر" value={formatPrice(ad.price)} />
              <Row label="المعرّف" value={ad.id} dir="ltr" />
            </dl>
          </Section>

          {/* -------------------------- owner ------------------------ */}
          <Section title="المالك" icon={User}>
            <dl>
              <Row label="الاسم" value={ad.ownerName} />
              <Row
                label="الهاتف"
                dir="ltr"
                value={
                  ad.ownerPhone ? (
                    <a
                      href={`tel:${ad.ownerPhone}`}
                      className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800"
                    >
                      <Phone size={14} />
                      {ad.ownerPhone}
                    </a>
                  ) : null
                }
              />
              <Row
                label="البريد الإلكتروني"
                dir="ltr"
                value={
                  ad.ownerEmail ? (
                    <a
                      href={`mailto:${ad.ownerEmail}`}
                      className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800"
                    >
                      <Mail size={14} />
                      {ad.ownerEmail}
                    </a>
                  ) : null
                }
              />
              <Row label="معرّف المالك" value={ad.ownerId} dir="ltr" />
            </dl>
          </Section>

          {/* ------------------------ moderation --------------------- */}
          <Section title="المراجعة" icon={ShieldCheck}>
            <dl>
              <Row label="الحالة" value={ad.moderation?.statusName || ad.moderation?.status} />
              <Row label="سبب الرفض" value={ad.moderation?.reasonName} />
              <Row label="ملاحظات" value={ad.moderation?.notes} />
              <Row label="تاريخ القرار" value={formatDateTime(ad.moderation?.decidedAt)} />
            </dl>
          </Section>

          {/* -------------------------- dates ------------------------ */}
          <Section title="التواريخ" icon={Calendar}>
            <dl>
              <Row label="تاريخ الإنشاء" value={formatDateTime(ad.createdAt)} />
              <Row label="تاريخ البدء" value={formatDateTime(ad.startDate)} />
              <Row label="تاريخ الانتهاء" value={formatDateTime(ad.endDate)} />
              <Row label="تاريخ انتهاء الصلاحية" value={formatDateTime(ad.expireAt)} />
              <Row
                label="الأيام المتبقية"
                value={
                  typeof ad.remainingDays === "number"
                    ? `${ad.remainingDays} يوم`
                    : null
                }
              />
            </dl>
          </Section>

          {/* ------------------- dynamic module fields --------------- */}
          {fields.length > 0 && (
            <Section title="تفاصيل القسم">
              <dl className="rounded-2xl border border-line bg-canvas px-3.5">
                {fields.map((field) => (
                  <Row
                    key={field.name}
                    label={field.label || field.name}
                    value={field.text}
                  />
                ))}
              </dl>
            </Section>
          )}

          {/* -------------------------- raw -------------------------- */}
          {ad.raw && (
            <section className="mt-6">
              <button
                type="button"
                onClick={() => setShowRaw((open) => !open)}
                aria-expanded={showRaw}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-brand-50"
              >
                البيانات الخام (Raw)
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-200 ${
                    showRaw ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showRaw && (
                <pre
                  dir="ltr"
                  className="mt-2 max-h-80 overflow-auto rounded-xl border border-line bg-brand-950 p-3.5 text-start text-[11.5px] leading-5 text-brand-100"
                >
                  {JSON.stringify(ad.raw, null, 2)}
                </pre>
              )}
            </section>
          )}
        </>
      )}
    </Modal>
  );
}
