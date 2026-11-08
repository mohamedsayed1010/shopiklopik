/* Length rules for what readers type into comments and reports.

   The API publishes no limit: Swagger's `CreateCommentRequest`,
   `CreateAskConsultCommentRequest` and `CreateListingReportRequest.details` are
   plain nullable strings with no `maxLength` (checked 2026-11-08). These are
   the app's own limits — generous for a comment or a report, short enough that
   a pasted page is caught here rather than sent. The server remains the
   authority; whatever it answers is still shown. One constant per field, used
   by every place that field is typed in. */
export const COMMENT_MAX_LENGTH = 1000;

export const REPORT_DETAILS_MAX_LENGTH = 1000;

/** Counter state for a field: what to show, and whether it is over. */
export function lengthState(text, max) {
  const length = typeof text === "string" ? text.length : 0;

  return {
    length,
    max,
    remaining: max - length,
    isOver: length > max,
    /* Coloured as a warning in the last tenth, so the limit is never a surprise. */
    isNear: length > max * 0.9,
    label: `${length}/${max}`,
  };
}

/**
 * A comment ready to send, or why not. Whitespace-only is empty; the length is
 * measured on what would be sent (trimmed).
 */
export function validateComment(text, max = COMMENT_MAX_LENGTH) {
  const value = typeof text === "string" ? text.trim() : "";

  if (!value) return { value: "", error: "اكتب تعليقًا قبل الإرسال." };

  if (value.length > max) {
    return { value, error: `التعليق أطول من الحد المسموح (${max} حرف).` };
  }

  return { value, error: null };
}

/**
 * Report details: optional, so empty and whitespace-only are both "none" and
 * are sent as an empty string, exactly as before.
 */
export function validateReportDetails(text, max = REPORT_DETAILS_MAX_LENGTH) {
  const value = typeof text === "string" ? text.trim() : "";

  if (value.length > max) {
    return { value, error: `التفاصيل أطول من الحد المسموح (${max} حرف).` };
  }

  return { value, error: null };
}

/** The reason the reader chose — never a default. Null until they choose one. */
export function selectedReportReason(picked, reasons = []) {
  if (picked === null || picked === undefined) return null;

  const value = Number(picked);

  return reasons.some((item) => Number(item?.id) === value) ? value : null;
}
