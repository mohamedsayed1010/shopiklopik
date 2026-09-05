import { useState } from "react";
import Seo from "../../components/Seo";
import { Link } from "react-router-dom";
import { ChevronLeft, Plus, Receipt, RotateCw } from "lucide-react";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import PaymentStatusBadge from "../../components/payments/PaymentStatusBadge";
import ScreenshotViewer from "../../components/payments/ScreenshotViewer";
import {
  useMyPaymentStatusOptions,
  useMyPayments,
} from "../../hooks/usePayments";
import { formatMoney, formatDateTime } from "../../utils/format";
import { reasonLabelFor } from "../../utils/paymentMethodFields";

function PaymentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4"
        >
          <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2.5 h-3 w-24" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>

          <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function PaymentCard({ payment }) {
  return (
    <li>
      <Link
        to={`/payments/${payment.id}`}
        className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
      >
        {/* Non-interactive: the whole card is a link, and a button inside an
            anchor is invalid. The receipt opens full size on the detail page. */}
        <ScreenshotViewer
          url={payment.screenshotUrl}
          size="md"
          interactive={false}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="tnum text-[17px] font-extrabold text-ink">
              {formatMoney(payment.amount, payment.currency)}
            </span>

            <PaymentStatusBadge
              status={payment.status}
              statusName={payment.statusName}
              size="sm"
            />
          </div>

          <p className="mt-1.5 truncate text-[13px] font-medium text-ink-soft">
            {payment.paymentMethod?.arabicName ||
              payment.paymentMethod?.name ||
              "—"}
          </p>

          <p className="mt-1 text-[12px] text-muted">
            {formatDateTime(payment.submittedAt)}
          </p>

          {payment.rejectReason && (
            <p className="mt-2.5 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] leading-6 text-red-700">
              <span className="font-bold">{reasonLabelFor(payment.status)}: </span>
              {payment.rejectReason}
            </p>
          )}
        </div>

        <ChevronLeft
          size={18}
          aria-hidden="true"
          className="mt-1 shrink-0 text-line-strong"
        />
      </Link>
    </li>
  );
}

export default function MyPaymentsPage() {
  const [status, setStatus] = useState("");

  const { paymentsQuery, payments } = useMyPayments({ status });

  /* Options come from the unfiltered view, so choosing a status does not
     shrink the very list of statuses the user is choosing from. */
  const { payments: allPayments } = useMyPayments({});

  const statusOptions = useMyPaymentStatusOptions(allPayments);

  const httpStatus = paymentsQuery.error?.response?.status;

  return (
    <>
      <Seo title="مدفوعاتي" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[820px] px-4 py-6 pb-24 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="الحساب"
          title="مدفوعاتي"
          subtitle="الدفعات التي أرسلتها وحالة مراجعتها."
          action={
            <Button as={Link} to="/payments/new" size="sm">
              <Plus size={16} />
              دفعة جديدة
            </Button>
          }
        />

        {statusOptions.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatus("")}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ring-1 ring-inset transition-colors duration-200 ${
                status === ""
                  ? "bg-brand-900 text-white ring-brand-900"
                  : "bg-surface text-ink-soft ring-line-strong hover:bg-brand-50"
              }`}
            >
              الكل
            </button>

            {statusOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatus(String(option.id))}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ring-1 ring-inset transition-colors duration-200 ${
                  status === String(option.id)
                    ? "bg-brand-900 text-white ring-brand-900"
                    : "bg-surface text-ink-soft ring-line-strong hover:bg-brand-50"
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          {paymentsQuery.isLoading ? (
            <PaymentsSkeleton />
          ) : paymentsQuery.isError ? (
            <ErrorState
              title={
                httpStatus === 429
                  ? "عدد كبير من الطلبات"
                  : "تعذّر تحميل المدفوعات"
              }
              description={
                httpStatus === 429
                  ? "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة."
                  : "حدث خطأ أثناء جلب مدفوعاتك. تحقّق من الاتصال وحاول مرة أخرى."
              }
              onRetry={paymentsQuery.refetch}
            />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={status ? "لا توجد مدفوعات بهذه الحالة" : "لا توجد مدفوعات"}
              description={
                status
                  ? "جرّب اختيار حالة أخرى."
                  : "لم ترسل أي دفعة حتى الآن."
              }
              action={
                status ? (
                  <Button variant="outline" onClick={() => setStatus("")}>
                    عرض الكل
                  </Button>
                ) : (
                  <Button as={Link} to="/payments/new">
                    <Plus size={16} />
                    إرسال دفعة
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="mb-3 flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => paymentsQuery.refetch()}
                  loading={paymentsQuery.isFetching && !paymentsQuery.isLoading}
                >
                  <RotateCw size={15} />
                  تحديث
                </Button>
              </div>

              <ul
                className={`space-y-3 transition-opacity duration-200 ${
                  paymentsQuery.isFetching ? "opacity-60" : ""
                }`}
              >
                {payments.map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
