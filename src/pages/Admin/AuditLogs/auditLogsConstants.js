export const AUDIT_SORT_OPTIONS = [
  { value: "-createdAt", label: "الأحدث أولاً" },
  { value: "createdAt", label: "الأقدم أولاً" },
  { value: "action", label: "حسب نوع العملية" },
];

export const DEFAULT_AUDIT_SORT = "-createdAt";

export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

const TARGET_TONES = {
  Advertisement: "bg-brand-50 text-brand-700 ring-brand-200",
  BannerBooking: "bg-violet-50 text-violet-700 ring-violet-200",
  BannerPlacement: "bg-violet-50 text-violet-700 ring-violet-200",
  Payment: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PaymentMethod: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Category: "bg-sky-50 text-sky-700 ring-sky-200",
  SubCategory: "bg-sky-50 text-sky-700 ring-sky-200",
  User: "bg-amber-50 text-amber-700 ring-amber-200",
  PlatformSettings: "bg-slate-100 text-slate-700 ring-slate-300",
  HomeSection: "bg-slate-100 text-slate-700 ring-slate-300",
  Governorate: "bg-teal-50 text-teal-700 ring-teal-200",
  Center: "bg-teal-50 text-teal-700 ring-teal-200",
  Project: "bg-teal-50 text-teal-700 ring-teal-200",
  Report: "bg-orange-50 text-orange-700 ring-orange-200",
  FormField: "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

const NEUTRAL_TONE = "bg-canvas text-ink-soft ring-line-strong";

export function targetTone(targetType) {
  return TARGET_TONES[targetType] ?? NEUTRAL_TONE;
}

const DESTRUCTIVE = /حذف|رفض|إيقاف|حظر|إنهاء|استرداد|تجاهل/;

const POSITIVE = /قبول|الموافقة|تأكيد|تفعيل|إضافة/;

export function actionTone(actionName) {
  const name = String(actionName ?? "");

  if (DESTRUCTIVE.test(name)) return "bg-red-50 text-red-700 ring-red-200";

  if (POSITIVE.test(name)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  return "bg-canvas text-ink-soft ring-line-strong";
}

/** A GUID is unreadable at full length in a table cell; show both ends. */
export function shortId(value) {
  const id = String(value ?? "");

  if (!id) return "";

  return id.length <= 13 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function parseAuditValue(value) {
  if (value === null || value === undefined || value === "") {
    return { kind: "empty", value: null };
  }

  const text = String(value);

  const trimmed = text.trim();

  // Only attempt a parse on something that looks structural; `JSON.parse` also
  // accepts bare numbers and quoted words, which would turn "5" into a "json".
  if (!/^[[{]/.test(trimmed)) return { kind: "text", value: text };

  try {
    return { kind: "json", value: JSON.parse(trimmed) };
  } catch {
    return { kind: "text", value: text };
  }
}
