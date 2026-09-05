import { parseApiDate } from "./format";

export const URGENT_WINDOW_MS = 30 * 60 * 1000;

export function urgentExpiryOf(item) {
  if (!item) return null;

  const approvedAt = parseApiDate(item.approvedAt);

  return approvedAt ? approvedAt.getTime() + URGENT_WINDOW_MS : null;
}

/** Milliseconds left in the window; `0` for anything not currently urgent. */
export function urgentRemainingMs(item, now = Date.now()) {
  const expiresAt = urgentExpiryOf(item);

  return expiresAt === null ? 0 : Math.max(0, expiresAt - now);
}

/** Whether one row is urgent *at a given instant* — the whole rule, in one call. */
export function isUrgentAt(item, now = Date.now()) {
  const expiresAt = urgentExpiryOf(item);

  return expiresAt !== null && expiresAt > now;
}

export function urgentRowsAt(items, now = Date.now()) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({ item, expiresAt: urgentExpiryOf(item) }))
    .filter(({ expiresAt }) => expiresAt !== null && expiresAt > now)
    .sort((a, b) => a.expiresAt - b.expiresAt)
    .map(({ item, expiresAt }) => ({
      item,
      expiresAt,
      remainingMs: expiresAt - now,
    }));
}

/** The first of these keys carrying real text, or "". */
function pickText(item, keys) {
  for (const key of keys) {
    const value = item?.[key];

    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

export function urgentRequestModel(item) {
  return {
    id: item?.id ?? null,

    /** What kind of request this is, in the backend's words. */
    kind: pickText(item, ["listingTypeName", "subCategoryName"]) || "عاجل",

    /** Who is asking. */
    name: pickText(item, ["requesterName", "rescuerName", "ownerName"]),

    /** The one thing that must be read at a glance — a blood group. */
    highlight: pickText(item, ["bloodGroupName"]),

    /** Where to go. */
    place: pickText(item, ["hospitalName", "address", "center", "governorate"]),

    /** What happened, in the asker's words. */
    body: pickText(item, ["details", "question", "title"]),

    href:
      item?.categoryId != null && item?.subCategoryId != null && item?.id
        ? `/dynamic/${item.categoryId}/${item.subCategoryId}/${item.id}`
        : null,
  };
}

export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
