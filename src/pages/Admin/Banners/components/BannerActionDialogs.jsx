import { useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import Skeleton from "../../../../components/ui/Skeleton";
import {
  errorClass,
  inputBase,
  inputIdle,
  inputInvalid,
  labelClass,
  selectClass,
} from "../../../../components/ui/formStyles";
import { useAdminBannerRejectionReasons } from "../../../../hooks/admin/useAdminBannerRequests";
import { formatMoney, formatDate } from "../../../../utils/format";

const MAX_NOTES = 1000;

/** Approve the banner — shows what the approval actually commits. */
export function ApproveBannerDialog({ open, booking, mutation, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="الموافقة على البانر"
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={mutation.isPending}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            fullWidth
            loading={mutation.isPending}
            onClick={onConfirm}
          >
            موافقة ونشر
          </Button>
        </div>
      }
    >
      <p className="text-[13px] leading-7 text-muted">
        سيتم حجز المساحة ونشر البانر للفترة الموضحة. قد يرفض الخادم الطلب إذا
        لم تعد المساحة متاحة.
      </p>

      {booking && (
        <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-canvas px-3.5">
          {[
            ["البانر", booking.title],
            ["المُعلن", booking.advertiserName],
            ["المساحة", booking.locationName],
            [
              "رقم المساحة",
              booking.slotNumber != null ? String(booking.slotNumber) : null,
            ],
            ["القسم", booking.categoryName],
            ["القسم الفرعي", booking.subCategoryName],
            ["المدة", booking.durationDisplay],
            [
              "الفترة",
              booking.startDate && booking.endDate
                ? `${formatDate(booking.startDate)} ← ${formatDate(booking.endDate)}`
                : null,
            ],
            ["السعر", booking.priceDisplay || formatMoney(booking.price, booking.currency)],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 py-2.5"
              >
                <dt className="shrink-0 text-[12px] text-muted">{label}</dt>

                <dd className="min-w-0 text-end text-[12.5px] font-semibold text-ink">
                  {value}
                </dd>
              </div>
            ))}
        </dl>
      )}
    </Modal>
  );
}

/** Reject the payment proof. Free-text notes, no vocabulary involved. */
export function RejectPaymentDialog({ open, mutation, onConfirm, onClose }) {
  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState(false);

  const trimmed = notes.trim();

  const tooLong = trimmed.length > MAX_NOTES;

  const missing = trimmed.length === 0;

  const invalid = (touched && missing) || tooLong;

  const submit = () => {
    setTouched(true);

    if (missing || tooLong || mutation.isPending) return;

    onConfirm(trimmed);
  };

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="رفض إثبات الدفع"
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={mutation.isPending}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            variant="danger"
            fullWidth
            loading={mutation.isPending}
            onClick={submit}
          >
            رفض الدفع
          </Button>
        </div>
      }
    >
      <label htmlFor="banner-payment-notes" className={labelClass}>
        ملاحظات
      </label>

      <textarea
        id="banner-payment-notes"
        rows={4}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={invalid}
        placeholder="مثال: صورة إثبات الدفع غير واضحة."
        className={`${inputBase} ${
          invalid ? inputInvalid : inputIdle
        } resize-y py-3 leading-7`}
      />

      <div className="mt-1.5 flex items-start justify-between gap-3">
        {invalid ? (
          <p role="alert" className={`${errorClass} mt-0`}>
            <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {tooLong ? `الحد الأقصى ${MAX_NOTES} حرفًا` : "الملاحظات مطلوبة"}
            </span>
          </p>
        ) : (
          <span />
        )}

        <span
          className={`tnum shrink-0 text-[11px] ${
            tooLong ? "text-red-600" : "text-muted"
          }`}
        >
          {trimmed.length} / {MAX_NOTES}
        </span>
      </div>
    </Modal>
  );
}

export function RejectBannerDialog({ open, mutation, onConfirm, onClose }) {
  const { reasons, reasonsQuery } = useAdminBannerRejectionReasons({
    enabled: open,
  });

  const [reason, setReason] = useState("");

  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState(false);

  const selected = reasons.find(
    (option) => String(option.value) === String(reason)
  );

  const notesRequired = Boolean(selected?.requiresNotes);

  const trimmed = notes.trim();

  const tooLong = trimmed.length > MAX_NOTES;

  const reasonMissing = reason === "";

  const notesMissing = notesRequired && trimmed.length === 0;

  const submit = () => {
    setTouched(true);

    if (reasonMissing || notesMissing || tooLong || mutation.isPending) return;

    onConfirm({ reason: Number(reason), notes: trimmed });
  };

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="رفض البانر"
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={mutation.isPending}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            variant="danger"
            fullWidth
            loading={mutation.isPending}
            onClick={submit}
          >
            رفض
          </Button>
        </div>
      }
    >
      {reasonsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : reasonsQuery.isError ? (
        <p role="alert" className={`${errorClass} mt-0`}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>تعذّر تحميل أسباب الرفض. أغلق النافذة وحاول مرة أخرى.</span>
        </p>
      ) : (
        <>
          <label htmlFor="banner-reject-reason" className={labelClass}>
            سبب الرفض
          </label>

          <div className="relative">
            <select
              id="banner-reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && reasonMissing}
              className={selectClass({ invalid: touched && reasonMissing })}
            >
              <option value="">اختر السبب</option>

              {reasons.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
            />
          </div>

          {touched && reasonMissing && (
            <p role="alert" className={errorClass}>
              <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>اختر سبب الرفض</span>
            </p>
          )}

          <label htmlFor="banner-reject-notes" className={`${labelClass} mt-4`}>
            ملاحظات {notesRequired ? "" : "(اختياري)"}
          </label>

          <textarea
            id="banner-reject-notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={(touched && notesMissing) || tooLong}
            placeholder={
              notesRequired
                ? "هذا السبب يتطلّب توضيحًا."
                : "تفاصيل إضافية للمُعلن…"
            }
            className={`${inputBase} ${
              (touched && notesMissing) || tooLong ? inputInvalid : inputIdle
            } resize-y py-3 leading-7`}
          />

          <div className="mt-1.5 flex items-start justify-between gap-3">
            {(touched && notesMissing) || tooLong ? (
              <p role="alert" className={`${errorClass} mt-0`}>
                <AlertCircle
                  size={13}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {tooLong
                    ? `الحد الأقصى ${MAX_NOTES} حرفًا`
                    : "هذا السبب يتطلّب ملاحظات"}
                </span>
              </p>
            ) : (
              <span />
            )}

            <span
              className={`tnum shrink-0 text-[11px] ${
                tooLong ? "text-red-600" : "text-muted"
              }`}
            >
              {trimmed.length} / {MAX_NOTES}
            </span>
          </div>
        </>
      )}
    </Modal>
  );
}

/** Approve payment / expire / delete — confirmations with no body. */
export function SimpleBannerConfirm({
  open,
  variant,
  booking,
  mutation,
  onConfirm,
  onClose,
}) {
  const copy = {
    approvePayment: {
      title: "اعتماد الدفع",
      description: `سيتم اعتماد إثبات الدفع${
        booking?.advertiserName ? ` المُرسل من ${booking.advertiserName}` : ""
      } وتغيير حالة الدفع.`,
      confirmLabel: "اعتماد",
      tone: "brand",
    },
    expire: {
      title: "إنهاء البانر",
      description:
        "سيتم إنهاء عرض البانر فورًا وتحرير المساحة. لا يمكن التراجع عن ذلك من هذه الشاشة.",
      confirmLabel: "إنهاء",
      tone: "danger",
    },
    delete: {
      title: "حذف طلب البانر",
      description: `سيتم حذف الطلب${
        booking?.title ? ` «${booking.title}»` : ""
      } نهائيًا. إذا رفض الخادم الحذف سيبقى الطلب كما هو.`,
      confirmLabel: "حذف",
      tone: "danger",
    },
  }[variant] ?? {};

  return (
    <ConfirmDialog
      open={open}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      tone={copy.tone}
      loading={mutation.isPending}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
