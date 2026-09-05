import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Ban, Megaphone } from "lucide-react";

import Seo from "../../components/Seo";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import {
  bannerPaymentTone,
  bannerStatusTone,
  bannerTimeline,
} from "../../utils/bannerModel";
import { formatDate, formatDateTime, formatMoney } from "../../utils/format";
import {
  useBannerBookingDetails,
  useCancelBannerBooking,
} from "../../hooks/useBannerBooking";

function Row({ label, value }) {
  if (!value && value !== 0) return null;

  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[12px] text-muted">{label}</dt>

      <dd className="min-w-0 text-end text-[12.5px] font-semibold text-ink">
        {value}
      </dd>
    </div>
  );
}

function Pill({ tone, children }) {
  if (!children) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${tone}`}
    >
      {children}
    </span>
  );
}

function Artwork({ label, image }) {
  const url = resolveMediaUrl(image?.url);

  if (!url) return null;

  return (
    <div className="rounded-2xl border border-line bg-canvas p-3">
      <p className="mb-2 text-[12px] font-bold text-ink">
        {image?.kindName || label}
      </p>

      <img
        src={url}
        alt={image?.kindName || label}
        loading="lazy"
        decoding="async"
        className="w-full rounded-xl border border-line object-cover"
      />

      {image?.resolution && (
        <p className="tnum mt-2 text-[11.5px] text-muted">{image.resolution}</p>
      )}
    </div>
  );
}

export default function BannerBookingDetailsPage() {
  const { id } = useParams();

  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { bookingQuery, booking } = useBannerBookingDetails({ id });

  const cancel = useCancelBannerBooking({
    onDone: () => setConfirmOpen(false),
  });

  const httpStatus = bookingQuery.error?.response?.status;

  /* The server answers 404 both for a booking that is not there and for one
     that is not the caller's — it does not admit which, and neither does
     this. */
  const isMissing = httpStatus === 404;

  const isAuthError = httpStatus === 401 || httpStatus === 403;

  /* Already decided against, or already over: nothing left to withdraw. */
  const canCancel =
    Boolean(booking) && !booking.rejectedAt && !booking.expiredAt;

  const timeline = bannerTimeline(booking);

  return (
    <>
      <Seo title="تفاصيل حجز المساحة" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[820px] px-4 py-6 pb-24 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="حجوزاتي الإعلانية"
          title={booking?.title || "تفاصيل الحجز"}
          className="mb-6"
        />

        {bookingQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : isAuthError ? (
          <ErrorState
            title="انتهت صلاحية جلستك"
            description="سجّل الدخول مرة أخرى لعرض هذا الحجز."
          />
        ) : isMissing ? (
          <EmptyState
            icon={Megaphone}
            title="الحجز غير موجود"
            description="ربما حُذف الحجز أو أن الرابط غير صحيح."
            action={
              <Button as={Link} to="/my-banner-bookings" variant="outline">
                حجوزاتي الإعلانية
              </Button>
            }
          />
        ) : bookingQuery.isError ? (
          <ErrorState
            title="تعذّر تحميل الحجز"
            description="حدث خطأ أثناء جلب تفاصيل الحجز. حاول مرة أخرى."
            onRetry={bookingQuery.refetch}
          />
        ) : booking ? (
          <div className="space-y-5">
            {/* Status */}
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {booking.isLive && (
                    <Pill tone="bg-emerald-50 text-emerald-700 ring-emerald-200">
                      يعرض الآن
                    </Pill>
                  )}

                  <Pill tone={bannerStatusTone(booking.status)}>
                    {booking.statusName}
                  </Pill>

                  <Pill tone={bannerPaymentTone(booking.paymentStatus)}>
                    {booking.paymentStatusName}
                  </Pill>
                </div>

                <p className="tnum text-lg font-extrabold text-ink">
                  {booking.priceDisplay ||
                    formatMoney(booking.price, booking.currency)}
                </p>
              </div>

              {booking.rejectionReasonName && (
                <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-3 text-[12.5px] leading-6 text-red-700">
                  {booking.rejectionReasonName}
                  {booking.rejectionNotes ? ` — ${booking.rejectionNotes}` : ""}
                </p>
              )}

              {canCancel && (
                <div className="mt-4 flex justify-end border-t border-line pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    className="text-red-600"
                  >
                    <Ban size={15} />
                    إلغاء الحجز
                  </Button>
                </div>
              )}
            </div>

            {/* Placement */}
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
              <p className="mb-2 text-[13px] font-bold text-ink">المساحة</p>

              <dl className="divide-y divide-line">
                <Row label="المساحة" value={booking.locationName} />
                <Row
                  label="رقم المساحة"
                  value={
                    booking.slotNumber != null ? String(booking.slotNumber) : null
                  }
                />
                <Row label="القسم" value={booking.categoryName} />
                <Row label="القسم الفرعي" value={booking.subCategoryName} />
                <Row label="المدة" value={booking.durationDisplay} />
                <Row
                  label="من"
                  value={booking.startDate ? formatDate(booking.startDate) : null}
                />
                <Row
                  label="إلى"
                  value={booking.endDate ? formatDate(booking.endDate) : null}
                />
              </dl>
            </div>

            {/* Content + artwork */}
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
              <p className="mb-2 text-[13px] font-bold text-ink">محتوى البانر</p>

              <dl className="divide-y divide-line">
                <Row label="العنوان" value={booking.title} />
                <Row label="الوصف" value={booking.description} />
                <Row label="نص الزر" value={booking.buttonText} />
                <Row label="رابط الوجهة" value={booking.targetUrl} />
              </dl>

              {(booking.preview?.desktop || booking.preview?.mobile) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Artwork label="Desktop" image={booking.preview?.desktop} />
                  <Artwork label="Mobile" image={booking.preview?.mobile} />
                </div>
              )}

              {booking.preview?.usageNote && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-brand-50 px-3.5 py-3 text-[12px] leading-6 text-ink-soft">
                  {booking.preview.usageNote}
                </p>
              )}
            </div>

            {/* Payment + advertiser */}
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
              <p className="mb-2 text-[13px] font-bold text-ink">الدفع والمُعلن</p>

              <dl className="divide-y divide-line">
                <Row
                  label="طريقة الدفع"
                  value={
                    booking.paymentMethod?.arabicName ||
                    booking.paymentMethod?.name
                  }
                />
                <Row label="اسم المُعلن" value={booking.advertiserName} />
                <Row label="رقم الهاتف" value={booking.phoneNumber} />
                <Row label="واتساب" value={booking.whatsAppNumber} />
                <Row label="البريد الإلكتروني" value={booking.email} />
              </dl>

              {resolveMediaUrl(booking.paymentProofUrl) && (
                <a
                  href={resolveMediaUrl(booking.paymentProofUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-[12.5px] font-semibold text-brand-700 underline"
                >
                  عرض إثبات التحويل
                </a>
              )}
            </div>

            {/* Timeline — only the milestones the server stamped a date on. */}
            {timeline.length > 0 && (
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
                <p className="mb-2 text-[13px] font-bold text-ink">المسار</p>

                <dl className="divide-y divide-line">
                  {timeline.map((entry) => (
                    <Row
                      key={entry.key}
                      label={entry.label}
                      value={formatDateTime(entry.at)}
                    />
                  ))}
                </dl>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="إلغاء الحجز"
        description="سيتم سحب طلب الحجز. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="إلغاء الحجز"
        cancelLabel="تراجع"
        loading={cancel.isPending}
        onConfirm={() => cancel.submit(id)}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
