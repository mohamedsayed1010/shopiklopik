
export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function userStatusTone(statusName) {
  const name = String(statusName ?? "");

  if (/فعال|نشط/.test(name)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (/محظور|حظر/.test(name)) return "bg-red-50 text-red-700 ring-red-200";

  if (/موقوف|إيقاف/.test(name)) {
    return "bg-orange-50 text-orange-700 ring-orange-200";
  }

  return "bg-canvas text-ink-soft ring-line-strong";
}

/** Initials for the avatar fallback — `image` is null for most accounts. */
export function initialsOf(name, userName) {
  const source = String(name || userName || "").trim();

  if (!source) return "؟";

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export const LISTING_COUNT_FIELDS = [
  { key: "total", label: "الإجمالي" },
  { key: "active", label: "نشط" },
  { key: "pending", label: "قيد المراجعة", emphasis: true },
  { key: "rejected", label: "مرفوض", emphasis: true },
  { key: "suspended", label: "موقوف", emphasis: true },
  { key: "expired", label: "منتهي" },
];
