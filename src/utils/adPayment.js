import { apiErrorText } from "./apiErrors";

/* The Admin Ad-Payment contract (`/api/v2/admin/ad-payment`), kept free of
   React and axios so every rule here can be unit-tested.

   Checked live with GETs only, on 2026-11-03:
   - Lists cap `PageSize` at 50 (default 10) and turn `PageIndex=0` into 1.
   - A reversed date range is a 400 ("تاريخ البداية لازم يكون قبل تاريخ
     النهاية"). Out-of-range values (`Type=999`, a non-UUID `AdvertisementId`)
     are silently ignored, not rejected, so the UI only offers documented values.
   - `IsPageIndexOutOfRange` changed nothing observable (true, false or garbage,
     with no data), so its meaning is unverified. The service layer passes it
     only when a caller sets a real boolean; no UI control offers it.
   - Settings answer `paymentMethodIds: []` together with
     `usesAllActiveMethods: true`, so an empty list means "all active methods".
   - A missing submission is a JSON 404 ("عملية الدفع غير موجودة."), on the
     screenshot endpoint too. A malformed id is a route-level 404. */

/** Documented `Status` values. Their names come from the server's `paymentStatusName`. */
export const AD_PAYMENT_STATUS_VALUES = Object.freeze([1, 2, 3, 4]);

/** Documented `Type` values: the listing module type ids. */
export const AD_PAYMENT_TYPE_VALUES = Object.freeze([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 50, 51, 52, 53, 54, 55, 56, 60,
  61, 62, 63, 65, 66, 67, 70, 71, 80, 81, 82, 83, 84, 85, 90, 91, 92, 93, 94, 100,
  101, 102, 103,
]);

/** The server caps `PageSize` at 50, so nothing larger is offered. */
export const AD_PAYMENT_PAGE_SIZES = Object.freeze([10, 20, 50]);

export const AD_PAYMENT_DEFAULT_PAGE_SIZE = 10;

const MAX_PAGE_SIZE = 50;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value) {
  return typeof value === "string" && UUID.test(value.trim());
}

const isFilled = (value) => typeof value === "string" && value.trim() !== "";

function toInt(value) {
  if (value === null || value === undefined || value === "") return undefined;

  const number = Number(value);

  return Number.isInteger(number) ? number : undefined;
}

function oneOf(value, allowed) {
  const number = toInt(value);

  return number !== undefined && allowed.includes(number) ? number : undefined;
}

/* A `YYYY-MM-DD` day becomes the start or end of that day in the same zone-less
   form every other admin list here sends. A full date-time passes through when
   it parses. Anything else is dropped. */
function toDateParam(value, edge) {
  if (!isFilled(value)) return undefined;

  const text = value.trim();

  if (DAY.test(text)) return `${text}T${edge === "end" ? "23:59:59" : "00:00:00"}`;

  return Number.isNaN(Date.parse(text)) ? undefined : text;
}

/** The comparable instant of a filter date, or null. */
function dateValue(value, edge) {
  const param = toDateParam(value, edge);

  if (!param) return null;

  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(param);

  const time = Date.parse(hasZone ? param : `${param}Z`);

  return Number.isNaN(time) ? null : time;
}

/** The server's own date-range rule, checked before a request is sent. */
export function dateRangeError(fromDate, toDate) {
  const from = dateValue(fromDate, "start");

  const to = dateValue(toDate, "end");

  if (from !== null && to !== null && from > to) {
    return "تاريخ البداية يجب أن يكون قبل تاريخ النهاية.";
  }

  return null;
}

/* The exact query for `GET /submissions` and `GET /history`. Names and casing
   are the contract's. Empty, undefined and invalid values are not sent. Zero is
   kept where it is a valid value (CategoryId). */
export function toAdPaymentListParams({
  status,
  type,
  categoryId,
  userId,
  advertisementId,
  fromDate,
  toDate,
  pageIndex,
  pageSize,
  isPageIndexOutOfRange,
} = {}) {
  const params = {};

  const statusValue = oneOf(status, AD_PAYMENT_STATUS_VALUES);
  if (statusValue !== undefined) params.Status = statusValue;

  const typeValue = oneOf(type, AD_PAYMENT_TYPE_VALUES);
  if (typeValue !== undefined) params.Type = typeValue;

  const category = toInt(categoryId);
  if (category !== undefined && category >= 0) params.CategoryId = category;

  if (isFilled(userId)) params.UserId = userId.trim();

  if (isUuid(advertisementId)) params.AdvertisementId = advertisementId.trim();

  const from = toDateParam(fromDate, "start");
  if (from) params.FromDate = from;

  const to = toDateParam(toDate, "end");
  if (to) params.ToDate = to;

  const page = toInt(pageIndex);
  params.PageIndex = page !== undefined && page > 0 ? page : 1;

  const size = toInt(pageSize);
  params.PageSize =
    size !== undefined && size > 0
      ? Math.min(size, MAX_PAGE_SIZE)
      : AD_PAYMENT_DEFAULT_PAGE_SIZE;

  if (typeof isPageIndexOutOfRange === "boolean") {
    params.IsPageIndexOutOfRange = isPageIndexOutOfRange;
  }

  return params;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const METHODS_MODE = Object.freeze({ all: "all", selected: "selected" });

/** The editable form, read from a settings payload. */
export function settingsToForm(settings) {
  const ids = Array.isArray(settings?.paymentMethodIds)
    ? settings.paymentMethodIds.map(Number).filter(Number.isInteger)
    : [];

  const usesAll = settings?.usesAllActiveMethods === true || ids.length === 0;

  return {
    isEnabled: settings?.isEnabled === true,
    price:
      settings?.price === null || settings?.price === undefined
        ? ""
        : String(settings.price),
    currency: typeof settings?.currency === "string" ? settings.currency : "",
    instructions:
      typeof settings?.instructions === "string" ? settings.instructions : "",
    methodsMode: usesAll ? METHODS_MODE.all : METHODS_MODE.selected,
    paymentMethodIds: usesAll ? [] : [...new Set(ids)],
  };
}

const PRICE = /^\d+(?:\.\d{1,2})?$/;

export function validateSettingsForm(form) {
  const errors = {};

  const price = String(form?.price ?? "").trim();

  if (price === "") errors.price = "أدخل سعر الإعلان.";
  else if (!PRICE.test(price)) {
    errors.price = "السعر رقم موجب بحد أقصى منزلتين عشريتين.";
  }

  if (!isFilled(form?.currency)) errors.currency = "أدخل العملة.";

  if (
    form?.methodsMode === METHODS_MODE.selected &&
    (!Array.isArray(form.paymentMethodIds) || form.paymentMethodIds.length === 0)
  ) {
    errors.paymentMethodIds = "اختر طريقة دفع واحدة على الأقل، أو استخدم كل الطرق النشطة.";
  }

  return errors;
}

/* The PUT body: exactly the five documented writable fields. Response-only
   fields (paymentMethods, usesAllActiveMethods, enabledAt, updatedAt,
   updatedBy, updatedByName) can never reach it, because it is built from
   named fields rather than spread from the record. "All active methods" is
   sent as `[]`, the same list the server itself answers for that state. */
export function toSettingsPayload(form) {
  const ids =
    form?.methodsMode === METHODS_MODE.selected && Array.isArray(form.paymentMethodIds)
      ? [...new Set(form.paymentMethodIds.map(Number).filter(Number.isInteger))]
      : [];

  return {
    isEnabled: form?.isEnabled === true,
    price: Number(String(form?.price ?? "").trim()),
    currency: String(form?.currency ?? "").trim(),
    instructions: String(form?.instructions ?? "").trim(),
    paymentMethodIds: ids,
  };
}

export function isSettingsDirty(form, initial) {
  if (!form || !initial) return false;

  return JSON.stringify(toSettingsPayload(form)) !== JSON.stringify(toSettingsPayload(initial));
}

/* ------------------------------------------------------------------ */
/* Review                                                              */
/* ------------------------------------------------------------------ */

/* The review `decision` values, confirmed by the backend team on 2026-11-03
   (Swagger types the field as a plain string and lists none). Case-sensitive.
   `rejectionReason` is free text the admin writes, not an enum. If either
   value is ever cleared, the review UI goes back to a notice and sends nothing. */
export const REVIEW_DECISION_VALUES = Object.freeze({
  approve: "Approve",
  reject: "Reject",
});

export function isReviewContractKnown(values = REVIEW_DECISION_VALUES) {
  return isFilled(values?.approve) && isFilled(values?.reject);
}

/* Reviewable means not yet decided, read from the record's own fields rather
   than from a status number whose meaning is not published: nothing has
   reviewed it, rejected it or consumed it. The server still decides (409). */
export function isAwaitingReview(submission) {
  if (!submission) return false;

  return (
    !submission.reviewedAt &&
    !submission.consumedAt &&
    !isFilled(submission.rejectionReason)
  );
}

export function rejectionReasonError(reason) {
  return isFilled(reason) ? null : "اكتب سبب الرفض ليظهر لصاحب الإعلان.";
}

/* The PATCH body, or null when it cannot be sent.
   - Approve: `{ decision: "Approve", rejectionReason: "" }`. No reason is asked
     for, and anything typed earlier is never carried over.
   - Reject: `{ decision: "Reject", rejectionReason: <the admin's text> }`, sent
     exactly as typed (any language, any punctuation). Only text with no visible
     character at all is refused, since that is no reason. */
export function toReviewPayload(
  { action, rejectionReason } = {},
  values = REVIEW_DECISION_VALUES
) {
  if (action !== "approve" && action !== "reject") return null;

  const decision = values?.[action];

  if (!isFilled(decision)) return null;

  if (action === "reject") {
    const reason = typeof rejectionReason === "string" ? rejectionReason : "";

    return isFilled(reason) ? { decision, rejectionReason: reason } : null;
  }

  return { decision, rejectionReason: "" };
}

/** The review answer: the payment plus the listing outcome the server reports. */
export function parseReviewResult(response) {
  const data = response?.data;

  if (!data || typeof data !== "object") return null;

  const text = (value) => (isFilled(value) ? value.trim() : null);

  return {
    payment: data.payment && typeof data.payment === "object" ? data.payment : null,
    listingAction: text(data.listingAction),
    listingActionName: text(data.listingActionName),
    listingModerationStatus: text(data.listingModerationStatus),
  };
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

const isDev = () => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
};

/* One message per documented status. Server words are shown where the server
   is explaining this request (400, 404, 409, 422); fixed text elsewhere,
   because a 5xx body may carry internals. The HTTP status decides, never the
   body's `success` field, which Swagger's examples show as true on errors. */
export function adPaymentErrorCopy(error, { subject = "البيانات" } = {}) {
  const status = error?.response?.status;

  const server = apiErrorText(error, "");

  if (!error?.response) {
    if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message ?? "")) {
      return { status: null, title: "انتهت مهلة الطلب", description: "استغرق الخادم وقتًا أطول من المعتاد. حاول مرة أخرى." };
    }

    return { status: null, title: "تعذّر الاتصال بالخادم", description: "تحقّق من اتصالك بالإنترنت ثم أعد المحاولة." };
  }

  switch (status) {
    case 400:
      return { status, title: "طلب غير صالح", description: server || "راجع القيم المدخلة ثم أعد المحاولة." };
    case 401:
      return { status, title: "انتهت صلاحية جلستك", description: "سجّل الدخول مرة أخرى للمتابعة." };
    case 403:
      return { status, title: "لا تملك الصلاحية", description: `لا تملك صلاحية الوصول إلى ${subject}.` };
    case 404:
      return { status, title: "غير موجود", description: server && !/الرابط المطلوب/.test(server) ? server : "لم يعد هذا العنصر موجودًا أو لم يعد متاحًا." };
    case 409:
      return { status, title: "تعارض مع الحالة الحالية", description: server || "تغيّرت حالة هذا الطلب على الخادم. حدّث البيانات ثم أعد المحاولة." };
    case 422:
      return { status, title: "لا يمكن تنفيذ العملية", description: server || "القيم المرسلة لا تحقق شروط الخادم." };
    case 429:
      return { status, title: "طلبات كثيرة", description: "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة." };
    default:
      if (status >= 500) {
        return {
          status,
          title: "خطأ في الخادم",
          description: `تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.${isDev() && server ? ` (${server})` : ""}`,
        };
      }

      return { status, title: "تعذّر إكمال الطلب", description: server || "حدث خطأ غير متوقع. حاول مرة أخرى." };
  }
}

/** One line for a toast. */
export function adPaymentErrorText(error, options) {
  const copy = adPaymentErrorCopy(error, options);

  return copy.status === 401 || copy.status === 403 || copy.status === 429 || copy.status >= 500 || copy.status === null
    ? copy.description
    : `${copy.title}: ${copy.description}`;
}

/* ------------------------------------------------------------------ */
/* Screenshot                                                          */
/* ------------------------------------------------------------------ */

/** A JSON error body that arrived as a Blob (responseType "blob"). */
export async function readBlobJson(blob) {
  if (!blob || typeof blob.text !== "function") return null;

  try {
    const text = await blob.text();

    if (!text.trim()) return null;

    const parsed = JSON.parse(text);

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function isImageBlob(blob) {
  return Boolean(blob && blob.size > 0 && /^image\//i.test(blob.type ?? ""));
}

const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/heic": "heic" };

export function screenshotFileName(id, mime) {
  const ext = EXTENSIONS[String(mime ?? "").toLowerCase()] ?? "img";

  return `payment-${String(id ?? "screenshot")}.${ext}`;
}

/** Whether a record says it has a screenshot. The URL itself is never loaded. */
export function hasScreenshot(submission) {
  return isFilled(submission?.screenshotUrl);
}
