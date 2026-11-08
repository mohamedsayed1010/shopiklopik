/**
 * The one reading of the `/api/payments/my` status filter.
 *
 * The payments page holds "no filter" as `""` (its select's empty option) while
 * other callers omit the filter entirely. Both send the same request — no
 * `status` parameter — so both must also land on the same cache entry. The
 * query key and the request parameters are built from this one value, which is
 * what keeps them from disagreeing again.
 *
 * Answers `null` for "no filter" (`undefined`, `null`, `""`, blanks, `"all"`,
 * or anything that is not a number) and the numeric status otherwise, so `"2"`
 * from a `<select>` and `2` from code are the same filter.
 */
export function normalizePaymentStatus(status) {
  if (status === undefined || status === null) return null;

  const text = String(status).trim();

  if (!text || text.toLowerCase() === "all") return null;

  const value = Number(text);

  return Number.isFinite(value) ? value : null;
}

/** The `params` for `GET /api/payments/my`: empty when there is no filter. */
export function myPaymentsParams(status) {
  const value = normalizePaymentStatus(status);

  return value === null ? {} : { status: value };
}
