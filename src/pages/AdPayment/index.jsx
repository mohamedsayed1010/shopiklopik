import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Seo from "../../components/Seo";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import ErrorSummary from "../../components/ui/ErrorSummary";
import Skeleton from "../../components/ui/Skeleton";
import AdPaymentSection from "../../components/payments/AdPaymentSection";
import useAdPaymentForm from "../../components/payments/useAdPaymentForm";
import useCreateAdForm from "../../components/CreateAd/useCreateAdForm";
import { useAdPaymentStatus, useSubmitAdPayment } from "../../hooks/useAdPayment";
import { paymentErrorText, paymentTarget } from "../../utils/adPaymentForm";
import { reviewFeedbackOf } from "../../utils/adPayment";

/* Tones for the stages Swagger documents for GET .../payment (NotRequired,
   AwaitingPayment, PaymentUnderReview, PaymentRejected, Paid). The text shown
   is always the server's `stageName`; an unknown stage gets a neutral tone. */
const STAGE_TONES = {
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PaymentUnderReview: "bg-gold-50 text-gold-700 ring-gold-200",
  PaymentRejected: "bg-red-50 text-red-700 ring-red-200",
  AwaitingPayment: "bg-orange-50 text-orange-700 ring-orange-200",
  NotRequired: "bg-canvas text-ink-soft ring-line-strong",
};

const NEUTRAL_TONE = "bg-canvas text-ink-soft ring-line-strong";

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

function formatAmount(amount, currency) {
  if (amount === null || amount === undefined) return null;

  const number = Number(amount);

  const text = Number.isFinite(number) ? number.toLocaleString("ar-EG", { maximumFractionDigits: 2 }) : String(amount);

  return currency ? `${text} ${currency}` : text;
}

/** Label/value rows; a missing value is not rendered at all. */
function DetailRows({ rows }) {
  const shown = rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== "");

  if (!shown.length) return null;

  return (
    <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {shown.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-3 px-3.5 py-2.5">
          <dt className="shrink-0 text-[12.5px] text-muted">{row.label}</dt>
          <dd className="min-w-0 whitespace-pre-line break-words text-end text-[13.5px] font-semibold text-ink" dir="auto">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

/* One advertisement's payment, for its owner: where it stands, the latest
   submission and the reviewer's answer, and — only when the server allows it
   (`canSubmit` / `canResubmit`) — the form to send or resend the proof. The
   advertisement type and every endpoint come from that form's Lookup. */
export default function AdPaymentPage() {
  const { categoryId, subCategoryId, id } = useParams();

  const lookupQuery = useCreateAdForm(categoryId, subCategoryId);

  const lookup = lookupQuery.formData;

  const payment = lookup?.payment ?? null;

  const statusQuery = useAdPaymentStatus({
    statusEndpoint: payment?.statusEndpoint,
    advertisementType: payment?.advertisementType,
    advertisementId: id,
    enabled: Boolean(payment?.isSubjectToPayment),
  });

  const status = statusQuery.data;

  const paymentForm = useAdPaymentForm(lookup);

  const submitPayment = useSubmitAdPayment();

  const [submitError, setSubmitError] = useState(null);

  // A rejected payment is resent through /resubmit; a first payment through the submit endpoint.
  const resubmit = status?.canResubmit === true;

  const canSend = Boolean(status && (status.canSubmit || status.canResubmit));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitPayment.isSubmitting || !canSend) return;

    if (paymentForm.gate !== "required") return;

    if (!paymentForm.validate()) return;

    const target = paymentTarget(lookup, id, { resubmit });

    if (!target) {
      setSubmitError("تعذّر تجهيز طلب الدفع لهذا الإعلان.");

      return;
    }

    setSubmitError(null);

    try {
      await submitPayment.submit({
        target,
        formData: paymentForm.buildFormData(),
        advertisementType: payment.advertisementType,
        advertisementId: id,
      });

      toast.success("تم إرسال إثبات الدفع، وهو الآن قيد المراجعة.", { duration: 6000 });

      paymentForm.resetForm();
    } catch (failure) {
      if (failure?.duplicate) return;

      setSubmitError(paymentErrorText(failure));

      // A 409 means the state moved on (or the price changed): show the current one.
      statusQuery.refetch();
    }
  };

  const loading = lookupQuery.isLoading || (payment?.isSubjectToPayment && statusQuery.isLoading);

  const notFound = statusQuery.error?.response?.status === 404;

  const stageTone = STAGE_TONES[status?.stage] ?? NEUTRAL_TONE;

  return (
    <>
      <Seo title="دفع الإعلان" robots="noindex, nofollow" />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow={lookup?.subCategory?.nameAr}
          title="دفع الإعلان"
          subtitle={status?.advertisementTitle || "حالة الدفع لإعلانك"}
          className="mb-6"
        />

        {loading ? (
          <PageSkeleton />
        ) : lookupQuery.isError || !lookup ? (
          <ErrorState title="تعذّر تحميل بيانات هذا القسم" />
        ) : !payment?.isSubjectToPayment ? (
          <ErrorState title="هذا الإعلان لا يتطلب دفعًا" description="لا توجد خطوة دفع لهذا النوع من الإعلانات." />
        ) : notFound ? (
          <ErrorState
            title="لم نجد هذا الإعلان ضمن إعلاناتك"
            description="قد يكون الرابط غير صحيح، أو أن الإعلان ليس من إعلاناتك."
          />
        ) : statusQuery.isError || !status ? (
          <ErrorState title="تعذّر تحميل حالة الدفع" onRetry={() => statusQuery.refetch()} />
        ) : (
          <div className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">حالة الدفع</h2>

                {(status.stageName || status.stage) && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset ${stageTone}`}
                  >
                    {status.stageName || status.stage}
                  </span>
                )}
              </div>

              <DetailRows
                rows={[
                  { label: "حالة آخر عملية دفع", value: status.hasPayment ? status.paymentStatusName : null },
                  { label: "المبلغ", value: formatAmount(status.amount, status.currency) },
                  { label: "طريقة الدفع", value: status.paymentMethodName },
                  { label: "تاريخ الإرسال", value: formatDate(status.submittedAt) },
                  { label: "تاريخ المراجعة", value: formatDate(status.reviewedAt) },
                  { label: "حالة الإعلان", value: status.advertisementModerationStatusName },
                ]}
              />

              {(status.rejectionReason || reviewFeedbackOf(status)) && (
                <div className="space-y-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] leading-6 text-red-800 ring-1 ring-inset ring-red-200">
                  {status.rejectionReason && (
                    <p>
                      <span className="font-semibold">سبب الرفض: </span>
                      <span className="whitespace-pre-line">{status.rejectionReason}</span>
                    </p>
                  )}
                  {reviewFeedbackOf(status) && (
                    <p>
                      <span className="font-semibold">ملاحظات المراجعة: </span>
                      <span className="whitespace-pre-line">{reviewFeedbackOf(status)}</span>
                    </p>
                  )}
                </div>
              )}

              {!canSend && !status.paymentsEnabled && status.isPaymentRequired && (
                <p className="text-[13px] text-muted">الدفع متوقف حاليًا من الإدارة. حاول لاحقًا.</p>
              )}
            </section>

            {canSend && (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <AdPaymentSection
                  paymentForm={paymentForm}
                  errors={paymentForm.visibleErrors}
                  disabled={submitPayment.isSubmitting}
                  title={resubmit ? "إعادة إرسال إثبات الدفع" : "إرسال إثبات الدفع"}
                />

                <ErrorSummary messages={submitError ? [submitError] : []} title="لم يكتمل إرسال الدفع" />

                {paymentForm.gate === "required" && (
                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    loading={submitPayment.isSubmitting}
                    className="w-full"
                  >
                    {submitPayment.isSubmitting
                      ? submitPayment.progress
                        ? `جارٍ الإرسال... ${submitPayment.progress}%`
                        : "جارٍ الإرسال..."
                      : resubmit
                        ? "إعادة إرسال الدفع"
                        : "إرسال الدفع"}
                  </Button>
                )}
              </form>
            )}

            <div className="text-center">
              <Link to="/profile" className="text-[13px] font-semibold text-brand-700 hover:underline">
                العودة إلى إعلاناتي
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
