import Seo from "../../components/Seo";
import { useParams } from "react-router-dom";
import { CheckCircle2, FileQuestion, XCircle } from "lucide-react";

import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import PaymentStatusBadge from "../../components/payments/PaymentStatusBadge";
import ScreenshotViewer from "../../components/payments/ScreenshotViewer";
import { usePaymentDetails } from "../../hooks/usePayments";
import {
  PAYMENT_STATUS,
  reasonLabelFor,
} from "../../utils/paymentMethodFields";
import { formatMoney, formatDateTime } from "../../utils/format";

/** A label/value row that renders nothing when there is no value. */
function Row({ label, value, ltr = false }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[12.5px] text-muted">{label}</dt>

      <dd
        dir={ltr ? "ltr" : undefined}
        className={`min-w-0 text-end text-[13.5px] font-semibold text-ink ${
          ltr ? "tnum" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function PaymentDetailsPage() {
  const { id } = useParams();

  const query = usePaymentDetails({ id });

  const payment = query.data?.data ?? null;

  const httpStatus = query.error?.response?.status;

  const isApproved = payment?.status === PAYMENT_STATUS.approved;

  const isRejected = payment?.status === PAYMENT_STATUS.rejected;

  return (
    <>
      <Seo title="تفاصيل الدفعة" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[720px] px-4 py-6 pb-24 sm:px-6 lg:py-10">
        <PageHeader eyebrow="المدفوعات" title="تفاصيل الدفعة" />

        <div className="mt-7">
          {query.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : httpStatus === 404 ? (
            <EmptyState
              icon={FileQuestion}
              title="الدفعة غير موجودة"
              description="ربما حُذفت أو أن الرابط غير صحيح."
            />
          ) : query.isError ? (
            <ErrorState
              title="تعذّر تحميل الدفعة"
              description="حدث خطأ أثناء جلب تفاصيل الدفعة. حاول مرة أخرى."
              onRetry={query.refetch}
            />
          ) : !payment ? null : (
            <div className="space-y-4">
              {/* Outcome banner — only for a decided payment. */}
              {isApproved && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                  <CheckCircle2
                    size={20}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-800">
                      تم قبول الدفعة
                    </p>

                    {payment.approvedAt && (
                      <p className="mt-0.5 text-[12.5px] text-emerald-700">
                        بتاريخ {formatDateTime(payment.approvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
                  <XCircle
                    size={20}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-red-800">
                      تم رفض الدفعة
                    </p>

                    {payment.rejectReason && (
                      <p className="mt-1 text-[13px] leading-6 text-red-700">
                        {payment.rejectReason}
                      </p>
                    )}

                    {payment.rejectedAt && (
                      <p className="mt-1 text-[12.5px] text-red-600">
                        بتاريخ {formatDateTime(payment.rejectedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {payment.rejectReason && !isRejected && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3.5">
                  <p className="text-[12.5px] font-bold text-orange-800">
                    {reasonLabelFor(payment.status)}
                  </p>

                  <p className="mt-1 text-[13px] leading-6 text-orange-700">
                    {payment.rejectReason}
                  </p>
                </div>
              )}

              {/* Amount + status */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5 shadow-xs">
                <div className="min-w-0">
                  <p className="text-[12.5px] text-muted">المبلغ</p>

                  <p className="tnum mt-1 text-2xl font-extrabold text-ink">
                    {formatMoney(payment.amount, payment.currency)}
                  </p>
                </div>

                <PaymentStatusBadge
                  status={payment.status}
                  statusName={payment.statusName}
                />
              </div>

              {/* Facts */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                <dl className="divide-y divide-line">
                  <Row
                    label="طريقة الدفع"
                    value={
                      payment.paymentMethod?.arabicName ||
                      payment.paymentMethod?.name
                    }
                  />

                  <Row label="نوع الطريقة" value={payment.paymentMethod?.typeName} />

                  <Row
                    label="تاريخ الإرسال"
                    value={formatDateTime(payment.submittedAt)}
                  />

                  <Row
                    label="تاريخ القبول"
                    value={
                      payment.approvedAt
                        ? formatDateTime(payment.approvedAt)
                        : null
                    }
                  />

                  <Row
                    label="تاريخ الرفض"
                    value={
                      payment.rejectedAt
                        ? formatDateTime(payment.rejectedAt)
                        : null
                    }
                  />

                  <Row label="رقم الدفعة" value={payment.id} ltr />
                </dl>

                {payment.notes && (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-[12.5px] text-muted">ملاحظاتك</p>

                    <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-7 text-ink-soft">
                      {payment.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Receipt */}
              {payment.screenshotUrl && (
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                  <p className="mb-3 text-[13px] font-bold text-ink">
                    صورة الإيصال
                  </p>

                  <ScreenshotViewer url={payment.screenshotUrl} size="lg" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
