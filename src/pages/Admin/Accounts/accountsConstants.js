
export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function accountStatusTone(isActive) {
  return isActive
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-slate-100 text-slate-600 ring-slate-300";
}

/** Initials for the avatar fallback — these rows carry no image. */
export function initialsOf(name, userName) {
  const source = String(name || userName || "").trim();

  if (!source) return "؟";

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}
