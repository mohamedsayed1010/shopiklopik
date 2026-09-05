
const AR = "ar-EG";

const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const BARE_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export function parseApiDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const fromNumber = new Date(value);

    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  if (typeof value !== "string") return null;

  const text = value.trim();

  if (!text) return null;

  const normalized =
    BARE_DATE_TIME.test(text) && !HAS_TIMEZONE.test(text)
      ? `${text.replace(" ", "T")}Z`
      : text;

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Milliseconds since a server timestamp; `null` when it cannot be read. */
export function ageInMs(value) {
  const date = parseApiDate(value);

  return date ? Date.now() - date.getTime() : null;
}

/** 250000 -> "250,000 جنيه" */
export function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return `${number.toLocaleString("en-US")} جنيه`;
}

export function formatMoney(value, currency) {
  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  const text = number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const unit = typeof currency === "string" ? currency.trim() : "";

  return unit ? `${text} ${unit}` : text;
}

export function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return String(value ?? "");

  return number.toLocaleString("en-US");
}

export function formatDate(value) {
  const date = parseApiDate(value);

  if (!date) return "";

  return date.toLocaleDateString(AR, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(value) {
  const date = parseApiDate(value);

  if (!date) return "";

  return date.toLocaleString(AR, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** [1, 2, 3–10, 11+] — Arabic's singular, dual, paucal and "many" forms. */
const UNITS = [
  { seconds: 60 * 60 * 24 * 365, forms: ["سنة", "سنتين", "سنوات", "سنة"] },
  { seconds: 60 * 60 * 24 * 30, forms: ["شهر", "شهرين", "أشهر", "شهرًا"] },
  { seconds: 60 * 60 * 24, forms: ["يوم", "يومين", "أيام", "يومًا"] },
  { seconds: 60 * 60, forms: ["ساعة", "ساعتين", "ساعات", "ساعة"] },
  { seconds: 60, forms: ["دقيقة", "دقيقتين", "دقائق", "دقيقة"] },
];

function arabicAgo(count, [one, two, few, many]) {
  if (count === 1) return `منذ ${one}`;

  if (count === 2) return `منذ ${two}`;

  if (count <= 10) return `منذ ${count} ${few}`;

  return `منذ ${count} ${many}`;
}

export function formatRelativeTime(value) {
  const date = parseApiDate(value);

  if (!date) return "";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "الآن";

  for (const unit of UNITS) {
    if (seconds < unit.seconds) continue;

    const count = Math.floor(seconds / unit.seconds);

    // Yesterday has its own word, and it is the one people expect to read.
    if (unit.seconds === 60 * 60 * 24 && count === 1) return "أمس";

    return arabicAgo(count, unit.forms);
  }

  return "الآن";
}

/** Strip spaces/dashes so the number works inside a tel: link. */
export function toPhoneHref(phone) {
  if (!phone) return null;

  const cleaned = String(phone).replace(/[^\d+]/g, "");

  return cleaned ? `tel:${cleaned}` : null;
}

/** Egyptian local numbers need the country code for wa.me. */
export function toWhatsAppHref(phone) {
  if (!phone) return null;

  let cleaned = String(phone).replace(/[^\d]/g, "");

  if (cleaned.startsWith("0")) cleaned = `2${cleaned}`;

  return cleaned ? `https://wa.me/${cleaned}` : null;
}

/** "primaryImageUrl" -> "Primary Image Url" (last-resort label). */
export function humanizeKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}
