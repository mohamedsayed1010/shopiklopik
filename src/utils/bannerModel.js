
export const BANNER_LOCATION = { slider1: 1, slider2: 2, subCategory: 3 };

export const BANNER_PAYMENT_STATUS = { pending: 1, approved: 2, rejected: 3 };

/** The rejection reason the live API marks `requiresNotes`. */
export const BANNER_REJECTION_OTHER = 99;

const STATUS_TONES = {
  1: "bg-gold-50 text-gold-700 ring-gold-200",
  2: "bg-brand-50 text-brand-700 ring-brand-200",
  3: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  4: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  5: "bg-red-50 text-red-700 ring-red-200",
  6: "bg-slate-100 text-slate-600 ring-slate-300",
  7: "bg-orange-50 text-orange-700 ring-orange-200",
};

const PAYMENT_TONES = {
  1: "bg-gold-50 text-gold-700 ring-gold-200",
  2: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  3: "bg-red-50 text-red-700 ring-red-200",
};

const NEUTRAL = "bg-canvas text-ink-soft ring-line-strong";

export function bannerStatusTone(status) {
  return STATUS_TONES[Number(status)] ?? NEUTRAL;
}

export function bannerPaymentTone(status) {
  return PAYMENT_TONES[Number(status)] ?? NEUTRAL;
}

export function resolveBannerStatus(statuses, raw) {
  const text = String(raw ?? "").trim();

  if (text === "") return null;

  const list = Array.isArray(statuses) ? statuses : [];

  const byName = list.find(
    (status) => String(status?.name ?? "").toLowerCase() === text.toLowerCase()
  );

  if (byName) return byName;

  const byArabic = list.find((status) => String(status?.nameAr ?? "") === text);

  if (byArabic) return byArabic;

  return list.find((status) => String(status?.id) === text) ?? null;
}

export function bannerStatusParam(status) {
  return status?.name || String(status?.id ?? "");
}

/** The label an administrator sees: Arabic where the server sent one. */
export function bannerStatusLabel(status) {
  return status?.nameAr || status?.name || `#${status?.id ?? ""}`;
}

export function optionsFromRows(rows, valueKey, nameKey, extra) {
  const seen = new Map();

  for (const row of rows ?? []) {
    const value = row?.[valueKey];

    if (value === null || value === undefined || seen.has(value)) continue;

    seen.set(value, { id: value, name: row[nameKey] || `#${value}` });
  }

  if (extra && extra.id !== undefined && !seen.has(extra.id)) {
    seen.set(extra.id, extra);
  }

  return [...seen.values()].sort((a, b) => a.id - b.id);
}

export function bannerTimeline(booking) {
  if (!booking) return [];

  return [
    { key: "submitted", label: "تم الإرسال", at: booking.submittedAt },
    { key: "paymentApproved", label: "اعتُمد الدفع", at: booking.paymentApprovedAt },
    { key: "approved", label: "تمت الموافقة", at: booking.approvedAt },
    { key: "published", label: "تم النشر", at: booking.publishedAt },
    { key: "rejected", label: "تم الرفض", at: booking.rejectedAt, tone: "danger" },
    { key: "expired", label: "انتهت الصلاحية", at: booking.expiredAt, tone: "muted" },
  ].filter((entry) => Boolean(entry.at));
}

export function bannerActions(booking) {
  if (!booking) return { payment: false, approve: false, expire: false };

  const payment = Number(booking.paymentStatus);

  const rejected = Boolean(booking.rejectedAt);

  const expired = Boolean(booking.expiredAt);

  return {
    payment: payment === BANNER_PAYMENT_STATUS.pending,
    approve:
      payment === BANNER_PAYMENT_STATUS.approved &&
      !rejected &&
      !expired &&
      !booking.publishedAt,
    reject: !rejected && !expired,
    expire: Boolean(booking.isLive),
  };
}

/** `["jpg","png"]` -> `"jpg، png"`, with the API's own wording preferred. */
export function formatFormats(spec) {
  if (spec?.allowedFormatNames) return spec.allowedFormatNames;

  const list = (spec?.allowedFormats ?? []).filter(Boolean);

  return list.length ? list.join("، ") : null;
}
