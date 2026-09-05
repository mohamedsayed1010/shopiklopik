import { useState } from "react";
import {
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  CircleUserRound,
  FileImage,
  History,
  Image as ImageIcon,
  Info,
  Link2,
  Megaphone,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";

import Button from "../../../../components/ui/Button";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import Modal from "../../../../components/ui/Modal";
import BannerStatusBadge, { LiveBadge } from "./BannerStatusBadge";
import {
  ApproveBannerDialog,
  RejectBannerDialog,
  RejectPaymentDialog,
  SimpleBannerConfirm,
} from "./BannerActionDialogs";
import {
  useApproveBanner,
  useApproveBannerPayment,
  useDeleteBannerRequest,
  useExpireBanner,
  useRejectBanner,
  useRejectBannerPayment,
} from "../../../../hooks/admin/useAdminBannerRequests";
import { bannerActions, bannerTimeline } from "../../../../utils/bannerModel";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";
import { formatMoney, formatDate, formatDateTime } from "../../../../utils/format";

/** A label/value row that renders nothing when the server sent no value. */
function Row({ label, value, ltr = false }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[12px] text-muted">{label}</dt>

      <dd
        dir={ltr ? "ltr" : undefined}
        className={`min-w-0 break-words text-end text-[12.5px] font-semibold text-ink ${
          ltr ? "tnum" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Section({ icon: Icon, title, badge, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
          {Icon && (
            <Icon
              size={16}
              strokeWidth={1.9}
              aria-hidden="true"
              className="text-brand-500"
            />
          )}
          {title}
        </h3>

        {badge}
      </div>

      {children}
    </section>
  );
}

function PreviewCard({ image, label, onOpen }) {
  const resolved = resolveMediaUrl(image?.url);

  return (
    <div className="rounded-xl border border-line bg-canvas p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-ink">
        <ImageIcon size={14} aria-hidden="true" className="text-brand-500" />
        {image?.kindName || label}
      </p>

      {resolved ? (
        <button
          type="button"
          onClick={() => onOpen(resolved, image?.kindName || label)}
          className="block w-full cursor-pointer overflow-hidden rounded-lg border border-line bg-surface transition-[border-color] duration-200 hover:border-brand-300"
        >
          <img
            src={resolved}
            alt={image?.kindName || label}
            loading="lazy"
            decoding="async"
            className="h-auto w-full object-contain"
          />
        </button>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong bg-surface px-3 py-6 text-center text-[12px] text-muted">
          لا توجد صورة
        </p>
      )}

      <dl className="mt-2 space-y-1">
        {image?.resolution && (
          <div className="flex justify-between gap-2 text-[11.5px]">
            <dt className="text-muted">الدقة</dt>
            <dd className="tnum font-semibold text-ink">{image.resolution}</dd>
          </div>
        )}

        {(image?.width || image?.height) && (
          <div className="flex justify-between gap-2 text-[11.5px]">
            <dt className="text-muted">الأبعاد</dt>
            <dd className="tnum font-semibold text-ink">
              {image.width} × {image.height}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export default function BannerRequestDetails({ query, onDeleted }) {
  const booking = query.data?.data ?? null;

  const [dialog, setDialog] = useState(null);

  const [lightbox, setLightbox] = useState(null);

  const close = () => setDialog(null);

  const approvePayment = useApproveBannerPayment({ onDone: close });

  const rejectPayment = useRejectBannerPayment({ onDone: close });

  const approve = useApproveBanner({ onDone: close });

  const reject = useRejectBanner({ onDone: close });

  const expire = useExpireBanner({ onDone: close });

  const remove = useDeleteBannerRequest({
    onDone: () => {
      close();

      onDeleted?.();
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (query.isError) {
    const status = query.error?.response?.status;

    return (
      <ErrorState
        title={status === 404 ? "الطلب غير موجود" : "تعذّر تحميل الطلب"}
        description={
          status === 404
            ? "ربما حُذف الطلب أو أن الرابط غير صحيح."
            : "حدث خطأ أثناء جلب تفاصيل الطلب. حاول مرة أخرى."
        }
        onRetry={status === 404 ? undefined : query.refetch}
      />
    );
  }

  if (!booking) return null;

  const actions = bannerActions(booking);

  const timeline = bannerTimeline(booking);

  const preview = booking.preview;

  const proof = resolveMediaUrl(booking.paymentProofUrl);

  const busy =
    approvePayment.mutation.isPending ||
    rejectPayment.mutation.isPending ||
    approve.mutation.isPending ||
    reject.mutation.isPending ||
    expire.mutation.isPending ||
    remove.mutation.isPending;

  return (
    <div className="space-y-4">
      {/* Headline */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 text-[15px] font-extrabold text-ink">
            {booking.title || "—"}
          </h2>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {booking.isLive && <LiveBadge size="sm" />}

            <BannerStatusBadge
              status={booking.paymentStatus}
              statusName={booking.paymentStatusName}
              kind="payment"
              size="sm"
            />

            <BannerStatusBadge
              status={booking.status}
              statusName={booking.statusName}
              size="sm"
            />
          </div>
        </div>

        <p className="tnum mt-2 text-lg font-extrabold text-ink">
          {booking.priceDisplay || formatMoney(booking.price, booking.currency)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {actions.payment && (
          <>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => setDialog("approvePayment")}
            >
              <Wallet size={15} />
              اعتماد الدفع
            </Button>

            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => setDialog("rejectPayment")}
            >
              <XCircle size={15} />
              رفض الدفع
            </Button>
          </>
        )}

        {actions.approve && (
          <Button size="sm" disabled={busy} onClick={() => setDialog("approve")}>
            <BadgeCheck size={15} />
            موافقة ونشر
          </Button>
        )}

        {actions.reject && (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => setDialog("reject")}
          >
            <XCircle size={15} />
            رفض البانر
          </Button>
        )}

        {actions.expire && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setDialog("expire")}
          >
            <CalendarRange size={15} />
            إنهاء
          </Button>
        )}

        <Button
          variant="danger-ghost"
          size="sm"
          disabled={busy}
          onClick={() => setDialog("delete")}
        >
          <Trash2 size={15} />
          حذف
        </Button>
      </div>

      {/* Rejection */}
      {(booking.rejectionReasonName || booking.rejectionNotes) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
          <p className="text-[12.5px] font-bold text-red-800">سبب الرفض</p>

          {booking.rejectionReasonName && (
            <p className="mt-1 text-[13px] font-semibold text-red-700">
              {booking.rejectionReasonName}
            </p>
          )}

          {booking.rejectionNotes && (
            <p className="mt-1 text-[12.5px] leading-6 text-red-700">
              {booking.rejectionNotes}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <Section icon={Megaphone} title="محتوى البانر">
        <dl className="divide-y divide-line">
          <Row label="العنوان" value={booking.title} />
          <Row label="الوصف" value={booking.description} />
          <Row label="نص الزر" value={booking.buttonText} />
          <Row label="رابط الوجهة" value={booking.targetUrl} ltr />
          <Row
            label="نوع الوجهة"
            value={
              booking.isInternalTarget === undefined
                ? null
                : booking.isInternalTarget
                ? "داخل المنصة"
                : "رابط خارجي"
            }
          />
        </dl>

        {booking.targetUrl && !booking.isInternalTarget && (
          <a
            href={booking.targetUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-900"
          >
            <Link2 size={14} aria-hidden="true" />
            فتح الرابط
          </a>
        )}
      </Section>

      {/* Preview */}
      {preview && (
        <Section icon={ImageIcon} title="معاينة التصميم">
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewCard
              image={preview.desktop}
              label="سطح المكتب"
              onOpen={(url, title) => setLightbox({ url, title })}
            />

            <PreviewCard
              image={preview.mobile}
              label="الهاتف"
              onOpen={(url, title) => setLightbox({ url, title })}
            />
          </div>

          {preview.usageNote && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-[12px] leading-6 text-ink-soft">
              <Info
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-brand-500"
              />
              <span className="whitespace-pre-line">{preview.usageNote}</span>
            </p>
          )}
        </Section>
      )}

      {/* Placement */}
      <Section icon={CalendarRange} title="المساحة والفترة">
        <dl className="divide-y divide-line">
          <Row label="المساحة" value={booking.locationName} />
          <Row
            label="رقم المساحة"
            value={booking.slotNumber != null ? String(booking.slotNumber) : null}
            ltr
          />
          <Row label="القسم" value={booking.categoryName} />
          <Row label="القسم الفرعي" value={booking.subCategoryName} />
          <Row
            label="المدة"
            value={
              booking.durationDisplay ||
              (booking.durationDays ? `${booking.durationDays} يوم` : null)
            }
          />
          <Row
            label="تاريخ البداية"
            value={booking.startDate ? formatDate(booking.startDate) : null}
          />
          <Row
            label="تاريخ النهاية"
            value={booking.endDate ? formatDate(booking.endDate) : null}
          />
        </dl>
      </Section>

      {/* Advertiser */}
      <Section icon={CircleUserRound} title="المُعلن">
        <dl className="divide-y divide-line">
          <Row label="الاسم" value={booking.advertiserName} />
          <Row label="الهاتف" value={booking.phoneNumber} ltr />
          <Row label="واتساب" value={booking.whatsAppNumber} ltr />
          <Row label="البريد الإلكتروني" value={booking.email} ltr />
        </dl>
      </Section>

      {/* Payment */}
      <Section
        icon={Wallet}
        title="الدفع"
        badge={
          <BannerStatusBadge
            status={booking.paymentStatus}
            statusName={booking.paymentStatusName}
            kind="payment"
            size="sm"
          />
        }
      >
        <dl className="divide-y divide-line">
          <Row
            label="السعر"
            value={
              booking.priceDisplay || formatMoney(booking.price, booking.currency)
            }
          />
          <Row label="العملة" value={booking.currency} ltr />
          <Row
            label="طريقة الدفع"
            value={
              booking.paymentMethod?.arabicName || booking.paymentMethod?.name
            }
          />
          <Row label="نوع الطريقة" value={booking.paymentMethod?.typeName} />
          <Row
            label="تاريخ اعتماد الدفع"
            value={
              booking.paymentApprovedAt
                ? formatDateTime(booking.paymentApprovedAt)
                : null
            }
          />
        </dl>

        {proof && (
          <div className="mt-3">
            <p className="mb-2 text-[12px] text-muted">إثبات الدفع</p>

            <button
              type="button"
              onClick={() => setLightbox({ url: proof, title: "إثبات الدفع" })}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2 text-[12.5px] font-semibold text-brand-700 transition-colors duration-200 hover:border-brand-300 hover:bg-brand-50"
            >
              <FileImage size={15} aria-hidden="true" />
              عرض إثبات الدفع
            </button>
          </div>
        )}
      </Section>

      {/* Timeline */}
      {timeline.length > 0 && (
        <Section icon={History} title="سجل الحالة">
          <ol className="space-y-3">
            {timeline.map((entry) => (
              <li key={entry.key} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    entry.tone === "danger"
                      ? "bg-red-500"
                      : entry.tone === "muted"
                      ? "bg-slate-400"
                      : "bg-emerald-500"
                  }`}
                />

                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink">
                    {entry.label}
                  </p>

                  <p className="tnum mt-0.5 text-[11.5px] text-muted">
                    {formatDateTime(entry.at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Confirmation */}
      <Section icon={CheckCircle2} title="الإقرار">
        <p className="flex items-center gap-2 text-[12.5px] text-ink-soft">
          {booking.confirmationAccepted ? (
            <>
              <CheckCircle2
                size={16}
                aria-hidden="true"
                className="shrink-0 text-emerald-600"
              />
              وافق المُعلن على الشروط عند الإرسال.
            </>
          ) : (
            <>
              <XCircle
                size={16}
                aria-hidden="true"
                className="shrink-0 text-red-600"
              />
              لم يُسجَّل قبول الشروط.
            </>
          )}
        </p>
      </Section>

      {/* Dialogs */}
      <SimpleBannerConfirm
        open={dialog === "approvePayment"}
        variant="approvePayment"
        booking={booking}
        mutation={approvePayment.mutation}
        onConfirm={() => approvePayment.submit(booking.id)}
        onClose={close}
      />

      <RejectPaymentDialog
        key={`reject-payment-${dialog === "rejectPayment"}`}
        open={dialog === "rejectPayment"}
        mutation={rejectPayment.mutation}
        onConfirm={(notes) =>
          rejectPayment.submit({ id: booking.id, notes })
        }
        onClose={close}
      />

      <ApproveBannerDialog
        open={dialog === "approve"}
        booking={booking}
        mutation={approve.mutation}
        onConfirm={() => approve.submit(booking.id)}
        onClose={close}
      />

      <RejectBannerDialog
        key={`reject-${dialog === "reject"}`}
        open={dialog === "reject"}
        mutation={reject.mutation}
        onConfirm={({ reason, notes }) =>
          reject.submit({ id: booking.id, reason, notes })
        }
        onClose={close}
      />

      <SimpleBannerConfirm
        open={dialog === "expire"}
        variant="expire"
        booking={booking}
        mutation={expire.mutation}
        onConfirm={() => expire.submit(booking.id)}
        onClose={close}
      />

      <SimpleBannerConfirm
        open={dialog === "delete"}
        variant="delete"
        booking={booking}
        mutation={remove.mutation}
        onConfirm={() => remove.submit(booking.id)}
        onClose={close}
      />

      {/* Image lightbox — payment proof and both artwork previews. */}
      <Modal
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        title={lightbox?.title}
        size="lg"
        footer={
          lightbox ? (
            <a
              href={lightbox.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition-colors duration-200 hover:text-brand-950"
            >
              <Link2 size={15} aria-hidden="true" />
              فتح في تبويب جديد
            </a>
          ) : null
        }
      >
        {lightbox && (
          <img
            src={lightbox.url}
            alt={lightbox.title}
            className="mx-auto max-h-[65vh] w-auto rounded-xl object-contain"
          />
        )}
      </Modal>
    </div>
  );
}
