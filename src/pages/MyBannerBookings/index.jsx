import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Megaphone, RotateCw } from "lucide-react";

import Seo from "../../components/Seo";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import { selectClass } from "../../components/ui/formStyles";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import {
  bannerPaymentTone,
  bannerStatusTone,
  optionsFromRows,
} from "../../utils/bannerModel";
import { formatDate, formatMoney } from "../../utils/format";
import { useMyBannerBookings } from "../../hooks/useBannerBooking";

function StatusPill({ tone, children }) {
  if (!children) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${tone}`}
    >
      {children}
    </span>
  );
}

function BookingRow({ booking }) {
  const cover = resolveMediaUrl(
    booking.desktopImageUrl || booking.mobileImageUrl
  );

  const period =
    booking.startDate && booking.endDate
      ? `${formatDate(booking.startDate)} ← ${formatDate(booking.endDate)}`
      : null;

  return (
    <Link
      to={`/banner-bookings/${booking.id}`}
      className="flex gap-4 rounded-2xl border border-line bg-surface p-4 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Megaphone size={20} strokeWidth={1.6} className="text-brand-300" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="min-w-0 truncate text-[14.5px] font-bold text-ink">
            {booking.title || "—"}
          </p>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {booking.isLive && (
              <StatusPill tone="bg-emerald-50 text-emerald-700 ring-emerald-200">
                يعرض الآن
              </StatusPill>
            )}

            <StatusPill tone={bannerStatusTone(booking.status)}>
              {booking.statusName}
            </StatusPill>

            <StatusPill tone={bannerPaymentTone(booking.paymentStatus)}>
              {booking.paymentStatusName}
            </StatusPill>
          </div>
        </div>

        <p className="mt-1 truncate text-[12.5px] text-muted">
          {[
            booking.locationName,
            booking.slotNumber != null ? `مساحة ${booking.slotNumber}` : null,
            [booking.categoryName, booking.subCategoryName]
              .filter(Boolean)
              .join(" › ") || null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
          <span className="tnum font-bold text-ink">
            {formatMoney(booking.price, booking.currency)}
          </span>

          {period && <span className="tnum">{period}</span>}

          {booking.submittedAt && (
            <span className="tnum">أُرسل {formatDate(booking.submittedAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function MyBannerBookingsPage() {
  const [status, setStatus] = useState("");

  const { bookingsQuery, bookings } = useMyBannerBookings({
    status: status === "" ? undefined : Number(status),
  });

  const statusOptions = useMemo(
    () =>
      optionsFromRows(
        bookings,
        "status",
        "statusName",
        status === "" ? undefined : { id: Number(status), name: `#${status}` }
      ),
    [bookings, status]
  );

  const httpStatus = bookingsQuery.error?.response?.status;

  const isAuthError = httpStatus === 401 || httpStatus === 403;

  return (
    <>
      <Seo title="حجوزاتي الإعلانية" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[900px] px-4 py-6 pb-24 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="الإعلانات"
          title="حجوزاتي الإعلانية"
          subtitle="حجوزات المساحات الإعلانية التي أرسلتها وحالة كل منها."
          className="mb-6"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => bookingsQuery.refetch()}
              loading={bookingsQuery.isFetching && !bookingsQuery.isLoading}
            >
              <RotateCw size={15} />
              تحديث
            </Button>
          }
        />

        {statusOptions.length > 0 && (
          <div className="relative mb-5 max-w-xs">
            <label htmlFor="booking-status" className="sr-only">
              حالة الحجز
            </label>

            <select
              id="booking-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={`${selectClass()} h-11 text-sm`}
            >
              <option value="">كل الحالات</option>

              {statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
            />
          </div>
        )}

        {bookingsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : isAuthError ? (
          <ErrorState
            title="انتهت صلاحية جلستك"
            description="سجّل الدخول مرة أخرى لعرض حجوزاتك."
          />
        ) : bookingsQuery.isError ? (
          <ErrorState
            title="تعذّر تحميل الحجوزات"
            description="حدث خطأ أثناء جلب حجوزاتك. تحقّق من الاتصال وحاول مرة أخرى."
            onRetry={bookingsQuery.refetch}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={status === "" ? "لا توجد حجوزات" : "لا توجد حجوزات بهذه الحالة"}
            description={
              status === ""
                ? "لم ترسل أي حجز لمساحة إعلانية حتى الآن."
                : "جرّب اختيار حالة أخرى."
            }
            action={
              status === "" ? (
                <Button as={Link} to="/banner-booking" variant="gold">
                  احجز مساحة إعلانية
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setStatus("")}>
                  كل الحالات
                </Button>
              )
            }
          />
        ) : (
          <div
            className={`space-y-3 transition-opacity duration-200 ${
              bookingsQuery.isFetching ? "opacity-60" : ""
            }`}
          >
            {bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
