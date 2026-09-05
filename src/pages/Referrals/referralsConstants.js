
export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** How many referrers the admin leaderboard asks for. The endpoint's `top`. */
export const DEFAULT_TOP_REFERRERS = 5;

export const TOP_REFERRERS_OPTIONS = [5, 10, 20];

export function referralStatusTone(statusName) {
  const name = String(statusName ?? "");

  if (/مكتمل|مفعل|مؤكد|نشط/.test(name)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (/انتظار|معلّق|معلق|قيد/.test(name)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (/ملغي|منتهي|مرفوض/.test(name)) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  return "bg-canvas text-ink-soft ring-line-strong";
}

/** Initials for the avatar fallback on a referral row. */
export function referralInitials(name, userName) {
  const source = String(name || userName || "").trim();

  if (!source) return "؟";

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 2);

  return `${parts[0][0]}${parts[1][0]}`;
}
