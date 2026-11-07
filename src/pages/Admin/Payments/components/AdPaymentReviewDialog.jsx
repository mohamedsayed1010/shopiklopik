import { useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { errorClass, inputClass, labelClass } from "../../../../components/ui/formStyles";
import { useReviewAdPaymentSubmission } from "../../../../hooks/admin/useAdminAdPayment";
import {
  adPaymentErrorCopy,
  rejectionReasonError,
  reviewFeedbackOf,
  toReviewPayload,
} from "../../../../utils/adPayment";
import { formatMoney } from "../../../../utils/format";
import AdPaymentStatusBadge from "./AdPaymentStatusBadge";

function Outcome({ result }) {
  const payment = result?.payment;

  return (
    <div className="space-y-3 text-sm">
      <p className="font-semibold text-ink">تم تسجيل قرار المراجعة. هذا ما أعاده الخادم:</p>

      <dl className="grid gap-2 rounded-2xl border border-line bg-canvas p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted">حالة الدفع</dt>
          <dd>
            <AdPaymentStatusBadge status={payment?.paymentStatus} statusName={payment?.paymentStatusName} size="md" />
          </dd>
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted">إجراء الإعلان</dt>
          <dd className="font-medium text-ink">
            {result?.listingActionName || result?.listingAction || "—"}
            {result?.listingActionName && result?.listingAction && (
              <span dir="ltr" className="ms-2 text-[12px] text-muted">({result.listingAction})</span>
            )}
          </dd>
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted">حالة مراجعة الإعلان</dt>
          <dd className="font-medium text-ink">{result?.listingModerationStatus || "—"}</dd>
        </div>

        {payment?.rejectionReason && (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">سبب الرفض</dt>
            <dd className="text-ink">{payment.rejectionReason}</dd>
          </div>
        )}

        {reviewFeedbackOf(payment) && (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">ملاحظات المراجعة</dt>
            <dd className="whitespace-pre-line text-ink">{reviewFeedbackOf(payment)}</dd>
          </div>
        )}
      </dl>

      <p className="text-[12.5px] leading-6 text-muted">
        القرار على الإعلان نفسه هو ما يحدده الخادم أعلاه، ولا تعني الموافقة على الدفع نشر الإعلان تلقائيًا.
      </p>
    </div>
  );
}

/* Approve or reject one submission: `PATCH /submissions/{id}/review`.
   Remounted per (action, submission), so a reason typed for one never carries
   over. The request is only sent when `toReviewPayload` can build it from
   verified decision values; otherwise this dialog is never offered. */
export default function AdPaymentReviewDialog({ action, submission, onClose }) {
  const [reason, setReason] = useState("");

  const [feedback, setFeedback] = useState("");

  const [touched, setTouched] = useState(false);

  const [result, setResult] = useState(null);

  const lock = useRef(false);

  const review = useReviewAdPaymentSubmission({
    onDone: (outcome) => setResult(outcome),
  });

  const isReject = action === "reject";

  const reasonError = isReject ? rejectionReasonError(reason) : null;

  const pending = review.isPending;

  /* The server's refusal stays on screen (a toast alone is gone in seconds). */
  const failure = review.isError ? adPaymentErrorCopy(review.error, { subject: "مراجعة المدفوعات" }) : null;

  const close = () => {
    if (pending) return;

    onClose();
  };

  const confirm = () => {
    setTouched(true);

    if (lock.current || reasonError) return;

    const body = toReviewPayload({ action, rejectionReason: reason, feedback });

    if (!body) return;

    lock.current = true;

    review.mutate(
      { paymentSubmissionId: submission.paymentSubmissionId, body },
      {
        onSettled: () => {
          lock.current = false;
        },
      }
    );
  };

  const title = result
    ? "نتيجة المراجعة"
    : isReject
      ? "رفض طلب الدفع"
      : "قبول طلب الدفع";

  return (
    <Modal
      open
      onClose={close}
      title={title}
      size="sm"
      footer={
        result ? (
          <Button fullWidth onClick={onClose}>
            إغلاق
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={close} disabled={pending}>
              إلغاء
            </Button>

            <Button
              variant={isReject ? "danger" : "primary"}
              fullWidth
              loading={pending}
              onClick={confirm}
            >
              {isReject ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
              {isReject ? "تأكيد الرفض" : "تأكيد القبول"}
            </Button>
          </div>
        )
      }
    >
      {result ? (
        <Outcome result={result} />
      ) : (
        <div className="space-y-4 text-sm">
          <p className="leading-7 text-ink-soft">
            {isReject
              ? "سيُرفض إثبات الدفع لهذا الإعلان ويظهر سبب الرفض لصاحبه."
              : "سيُعتمد إثبات الدفع لهذا الإعلان. سيحدد الخادم ما يحدث للإعلان بعد ذلك."}
          </p>

          <dl className="grid gap-1.5 rounded-2xl border border-line bg-canvas p-4 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">الإعلان</dt>
              <dd className="min-w-0 truncate font-medium text-ink">{submission?.advertisementTitle || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">المبلغ</dt>
              <dd className="tnum font-medium text-ink">{formatMoney(submission?.amount, submission?.currency) ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">صاحب الإعلان</dt>
              <dd className="min-w-0 truncate text-ink">{submission?.ownerName || "—"}</dd>
            </div>
          </dl>

          {isReject && (
            <div>
              <label htmlFor="ad-payment-reject-reason" className={labelClass}>
                سبب الرفض
              </label>

              <textarea
                id="ad-payment-reject-reason"
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                onBlur={() => setTouched(true)}
                disabled={pending}
                aria-invalid={Boolean(touched && reasonError) || undefined}
                aria-describedby={touched && reasonError ? "ad-payment-reject-reason-error" : undefined}
                className={`${inputClass({ invalid: Boolean(touched && reasonError), sized: false })} py-3`}
              />

              {touched && reasonError && (
                <p id="ad-payment-reject-reason-error" className={errorClass}>
                  {reasonError}
                </p>
              )}
            </div>
          )}

          {failure && (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-[13px] leading-6 text-red-800 ring-1 ring-inset ring-red-200">
              <span className="font-semibold">{failure.title}{failure.status ? ` (${failure.status})` : ""}: </span>
              {failure.description}
            </p>
          )}

          <div>
            <label htmlFor="ad-payment-review-feedback" className={labelClass}>
              ملاحظات لصاحب الإعلان <span className="font-normal text-muted">(اختياري)</span>
            </label>

            <textarea
              id="ad-payment-review-feedback"
              rows={3}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              disabled={pending}
              className={`${inputClass({ sized: false })} py-3`}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
