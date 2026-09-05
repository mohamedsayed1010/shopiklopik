import { useState } from "react";
import {
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Flag,
  Gavel,
  Package,
  PencilLine,
  ShieldOff,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import {
  isOpenStatus,
  reasonTone,
  reportStatusTone,
} from "../reportsConstants";
import { formatDateTime } from "../../../../utils/format";

function Section({ title, icon: Icon, children }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-wide text-muted">
        {Icon && <Icon size={14} strokeWidth={2.2} aria-hidden="true" />}
        {title}
      </h3>

      <div className="rounded-2xl border border-line bg-canvas px-3.5">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value, dir }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 text-[12.5px] text-muted">{label}</dt>

      <dd
        dir={dir}
        className="min-w-0 break-words text-end text-[13px] font-medium text-ink-soft"
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function CopyableId({ value }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(value).then(
          () => {
            setCopied(true);

            setTimeout(() => setCopied(false), 1500);
          },
          () => {}
        )
      }
      aria-label={`نسخ ${value}`}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-brand-50"
    >
      <span dir="ltr" className="tnum text-[12px]">
        {value}
      </span>

      {copied ? (
        <Check size={12} aria-hidden="true" className="shrink-0 text-emerald-600" />
      ) : (
        <Copy size={12} aria-hidden="true" className="shrink-0 text-muted" />
      )}
    </button>
  );
}

export default function AdminReportDetails({
  open,
  onClose,
  report,
  onIgnore,
  onAction,
  onUpdate,
}) {

  const stillOpen = report && isOpenStatus(report.statusName);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تفاصيل البلاغ"
      description={report?.listingTitle || undefined}
      size="lg"
      footer={
        report && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onUpdate(report)}>
              <PencilLine size={15} />
              تحديث الحالة
            </Button>

            {/* The two decisions are only offered while the report is open. */}
            {stillOpen && (
              <>
                <Button size="sm" variant="ghost" onClick={() => onIgnore(report)}>
                  <ShieldOff size={15} />
                  تجاهل
                </Button>

                <Button size="sm" variant="danger" onClick={() => onAction(report)}>
                  <Gavel size={15} />
                  اتخاذ إجراء
                </Button>
              </>
            )}
          </div>
        )
      }
    >
      {!report ? null : (
        <>
          {/* --------------------------- summary --------------------------- */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${reportStatusTone(
                report.statusName
              )}`}
            >
              {report.statusName || "—"}
            </span>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${reasonTone(
                report.reasonName
              )}`}
            >
              {report.reasonName || "—"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft ring-1 ring-inset ring-line-strong">
              <Package size={12} aria-hidden="true" />
              {report.listingTypeName || "—"}
            </span>
          </div>

          {/* ---------------------------- report --------------------------- */}
          <Section title="البلاغ" icon={Flag}>
            <Row label="السبب" value={report.reasonName} />

            <Row
              label="تفاصيل البلاغ"
              value={
                report.details?.trim() ? (
                  <span className="whitespace-pre-wrap leading-6">
                    {report.details}
                  </span>
                ) : (
                  <span className="text-muted">لم يكتب المُبلِّغ تفاصيل</span>
                )
              }
            />

            <Row label="تاريخ البلاغ" value={formatDateTime(report.createdAt)} />

            <Row label="معرّف البلاغ" value={<CopyableId value={report.id} />} dir="ltr" />
          </Section>

          {/* ---------------------------- listing -------------------------- */}
          <Section title="الإعلان المُبلَّغ عنه" icon={Package}>
            <Row
              label="العنوان"
              value={
                report.listingTitle || (
                  <span className="text-muted">إعلان محذوف أو غير متاح</span>
                )
              }
            />

            <Row label="النوع" value={report.listingTypeName} />

            <Row
              label="معرّف الإعلان"
              value={<CopyableId value={report.listingId} />}
              dir="ltr"
            />

            <Row
              label="معرّف صاحب الإعلان"
              value={<CopyableId value={report.listingOwnerId} />}
              dir="ltr"
            />

            {/* The ads page is filtered by module, so this narrows to the
                reported listing's type rather than pretending to deep-link to
                a record the admin ads list addresses by its own route. */}
            {report.listingType != null && (
              <Row
                label="فتح في إدارة الإعلانات"
                value={
                  <Link
                    to={`/admin/ads?type=${report.listingType}`}
                    className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800"
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                    عرض إعلانات هذا القسم
                  </Link>
                }
              />
            )}
          </Section>

          {/* --------------------------- reporter -------------------------- */}
          <Section title="المُبلِّغ" icon={User}>
            <Row label="الاسم" value={report.reporterName} />

            <Row
              label="معرّف المُبلِّغ"
              value={<CopyableId value={report.reporterUserId} />}
              dir="ltr"
            />
          </Section>

          {/* ---------------------------- review --------------------------- */}
          <Section title="المراجعة" icon={ClipboardCheck}>
            <Row label="الحالة" value={report.statusName} />

            <Row
              label="تاريخ المراجعة"
              value={
                report.reviewedAt ? (
                  formatDateTime(report.reviewedAt)
                ) : (
                  <span className="text-muted">لم تتم المراجعة بعد</span>
                )
              }
            />

            <Row
              label="ملاحظة الإدارة"
              value={
                report.adminNote?.trim() ? (
                  <span className="whitespace-pre-wrap leading-6">
                    {report.adminNote}
                  </span>
                ) : (
                  <span className="text-muted">لا توجد ملاحظة</span>
                )
              }
            />
          </Section>
        </>
      )}
    </Modal>
  );
}
