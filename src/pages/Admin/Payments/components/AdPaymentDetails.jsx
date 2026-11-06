import { CheckCircle2, Info, XCircle } from "lucide-react";

import Button from "../../../../components/ui/Button";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import AdPaymentStatusBadge from "./AdPaymentStatusBadge";
import AdPaymentScreenshot from "./AdPaymentScreenshot";
import {
  adPaymentErrorCopy,
  isAwaitingReview,
  isReviewContractKnown,
} from "../../../../utils/adPayment";
import { formatDateTime, formatMoney } from "../../../../utils/format";

/* A value or nothing. Missing fields stay empty ("—") rather than being filled
   with anything the server did not send. */
function Row({ label, value, ltr = false, mono = false }) {
  const empty = value === null || value === undefined || value === "";

  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd
        dir={ltr && !empty ? "ltr" : undefined}
        className={`min-w-0 break-words text-[13.5px] text-ink [overflow-wrap:anywhere] ${mono ? "font-mono text-[12.5px]" : ""} ${ltr && !empty ? "text-end sm:text-start" : ""}`}
      >
        {empty ? <span className="text-muted">—</span> : value}
      </dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-1 text-[13px] font-bold text-ink">{title}</h3>
      <dl className="divide-y divide-line">{children}</dl>
    </section>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

const withId = (name, id) =>
  name && id !== null && id !== undefined && id !== "" ? `${name} (#${id})` : name || (id ?? null);

/* Every field `GET /submissions/{id}` returns. Review is offered with
   payments → View (what the review endpoint requires), only while the record
   shows no decision yet, and only while decision values are configured.
   `readOnly` (history) never offers it. */
export default function AdPaymentDetails({ query, canApprove, readOnly = false, onReview, onOverlayChange }) {
  if (query.isLoading) return <DetailsSkeleton />;

  if (query.isError) {
    const copy = adPaymentErrorCopy(query.error, { subject: "تفاصيل المدفوعات" });

    return (
      <ErrorState
        title={copy.title}
        description={copy.description}
        onRetry={copy.status === 404 || copy.status === 403 ? undefined : query.refetch}
      />
    );
  }

  const item = query.data?.data;

  if (!item || typeof item !== "object") {
    return (
      <ErrorState
        title="لا توجد بيانات"
        description="لم يُرجع الخادم بيانات لهذا الطلب."
        onRetry={query.refetch}
      />
    );
  }

  const reviewable = !readOnly && canApprove && isAwaitingReview(item);

  const contractKnown = isReviewContractKnown();

  return (
    <div className={`space-y-4 transition-opacity ${query.isFetching ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold text-ink">{item.advertisementTitle || "—"}</p>
          <p className="tnum mt-1 text-[18px] font-extrabold text-brand-900">
            {formatMoney(item.amount, item.currency) ?? "—"}
          </p>
        </div>

        <AdPaymentStatusBadge status={item.paymentStatus} statusName={item.paymentStatusName} size="md" />
      </div>

      {reviewable && (
        <div className="rounded-2xl border border-line bg-canvas p-4">
          {contractKnown ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onReview?.("approve", item)}>
                <CheckCircle2 size={16} />
                قبول الدفع
              </Button>

              <Button size="sm" variant="danger" onClick={() => onReview?.("reject", item)}>
                <XCircle size={16} />
                رفض الدفع
              </Button>
            </div>
          ) : (
            <p role="note" className="flex items-start gap-2 text-[13px] leading-6 text-ink-soft">
              <Info size={16} className="mt-1 shrink-0 text-brand-500" aria-hidden="true" />
              مراجعة طلبات الدفع من هنا غير متاحة بعد: لم يحدد الخادم القيم المقبولة لقرار المراجعة. لن يُرسل أي قرار حتى يتم توثيقها.
            </p>
          )}
        </div>
      )}

      <Section title="الإيصال">
        <div className="py-2.5">
          <AdPaymentScreenshot submission={item} onOpenChange={onOverlayChange} />
        </div>
      </Section>

      <Section title="الدفع">
        <Row label="معرّف طلب الدفع" value={item.paymentSubmissionId} ltr mono />
        <Row label="المبلغ" value={item.amount ?? null} ltr />
        <Row label="العملة" value={item.currency} ltr />
        <Row label="طريقة الدفع" value={withId(item.paymentMethodName, item.paymentMethodId)} />
        <Row label="بيانات الدفع" value={item.paymentInfo} ltr />
        <Row label="الرقم المرجعي للتحويل" value={item.transactionReference} ltr mono />
        <Row label="حالة الدفع" value={withId(item.paymentStatusName, item.paymentStatus)} />
        <Row label="تاريخ الإرسال" value={formatDateTime(item.submittedAt) || null} />
        <Row label="تاريخ الاستخدام" value={formatDateTime(item.consumedAt) || null} />
      </Section>

      <Section title="المراجعة">
        <Row label="تاريخ المراجعة" value={formatDateTime(item.reviewedAt) || null} />
        <Row label="المراجِع" value={item.reviewedByName} />
        <Row label="معرّف المراجِع" value={item.reviewedBy} ltr mono />
        <Row label="سبب الرفض" value={item.rejectionReason} />
      </Section>

      <Section title="الإعلان">
        <Row label="العنوان" value={item.advertisementTitle} />
        <Row label="معرّف الإعلان" value={item.advertisementId} ltr mono />
        <Row label="نوع الإعلان" value={withId(item.advertisementTypeName, item.advertisementType)} />
        <Row label="القسم" value={withId(item.categoryName, item.categoryId)} />
        <Row label="القسم الفرعي" value={withId(item.subCategoryName, item.subCategoryId)} />
      </Section>

      <Section title="صاحب الإعلان">
        <Row label="الاسم" value={item.ownerName} />
        <Row label="معرّف المستخدم" value={item.ownerId} ltr mono />
        <Row label="الهاتف" value={item.ownerPhone} ltr />
        <Row label="البريد الإلكتروني" value={item.ownerEmail} ltr />
      </Section>
    </div>
  );
}
