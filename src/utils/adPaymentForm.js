import { apiErrorText } from "./apiErrors";

/* The user side of ad payments, driven entirely by the create-ad-form Lookup
   (`data.payment`) and `GET /api/v2/ad-payment/config`. Kept free of React and
   axios so every rule here can be tested on its own.

   Verified against Swagger ("MarkatPlace V1") and live GETs on 2026-11-06:
   - Every one of the 65 listing module types is subject to payment, but nothing
     here relies on that: `isSubjectToPayment` decides, per Lookup.
   - Endpoint templates use `{advertisementType}` and `{advertisementId}`; the
     server accepts the numeric type or its key in that segment.
   - The payment is a second request after the advertisement is created: the
     create endpoint answers with the new id in `data.id`, and the payment
     endpoints take it in the path. Payment fields never go to the create call.
   - `ExpectedAmount` / `ExpectedCurrency` are `visible: false` fields: the
     client sends the price and currency it showed, and a change in between is
     refused with 409 instead of charging a different amount.
   - Payment status numbers have no published names: only `paymentStatusName`
     and `stage` / `stageName` from the server are shown. */

/** Fills a Lookup endpoint template. Null when a placeholder cannot be filled. */
export function fillPaymentEndpoint(template, { advertisementType, advertisementId } = {}) {
  if (typeof template !== "string" || template.trim() === "") return null;

  const values = { advertisementType, advertisementId };

  let missing = false;

  const url = template.replace(/\{(\w+)\}/g, (_, name) => {
    const value = values[name];

    if (value === undefined || value === null || value === "") {
      missing = true;

      return "";
    }

    return encodeURIComponent(String(value));
  });

  return missing ? null : url;
}

/** The Lookup's payment block, or null when the Lookup has none. */
export function paymentBlockOf(formData) {
  const payment = formData?.payment;

  return payment && typeof payment === "object" ? payment : null;
}

/** Payment applies to this form at all (before the live config is known). */
export function isSubjectToPayment(formData) {
  return paymentBlockOf(formData)?.isSubjectToPayment === true;
}

/* Where the form stands on payment, from the Lookup and the live config:
   - "none":     not subject to payment, or payments are switched off. The
                 ordinary flow runs exactly as before.
   - "loading":  subject to payment and the config is still loading.
   - "error":    subject to payment and the config could not be read. Payment
                 is never skipped on a failure: submission waits for a retry.
   - "required": the payment section is shown and must be completed. */
export function paymentGate({ formData, config, configStatus }) {
  if (!isSubjectToPayment(formData)) return "none";

  if (configStatus === "pending" || configStatus === "loading") return "loading";

  if (configStatus === "error" || !config) return "error";

  return config.isEnabled === true ? "required" : "none";
}

/** The Lookup's payment fields, ordered. Hidden ones stay in: the form fills them. */
export function paymentFieldsOf(formData) {
  const fields = paymentBlockOf(formData)?.fields;

  if (!Array.isArray(fields)) return [];

  return [...fields].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
}

/* Lookup payment fields this app leaves out while they are OPTIONAL, by
   product decision (2026-11-06): never rendered, never validated, never sent.
   The moment the Lookup marks one required, it is shown and sent like any
   other field, so the form can never be blocked by a field it hides. */
export const EXCLUDED_PAYMENT_FIELDS = Object.freeze(["TransactionReference"]);

const isRequiredField = (field) => field?.required === true || field?.isRequired === true;

const isExcluded = (field) => EXCLUDED_PAYMENT_FIELDS.includes(field?.name) && !isRequiredField(field);

/** The fields the user fills in: everything the Lookup marks as visible, minus the excluded ones. */
export function userPaymentFields(fields = []) {
  return fields.filter((field) => field?.visible !== false && field?.type !== "hidden" && !isExcluded(field));
}

/** Fields the client fills from the config the user was shown. */
const SHOWN_CONFIG_VALUES = {
  ExpectedAmount: (config) => config?.price,
  ExpectedCurrency: (config) => config?.currency,
};

/** A payment method's name for the user: Arabic first, as the rest of the app. */
export function paymentMethodLabel(method) {
  const label = method?.arabicName?.trim() || method?.name?.trim();

  return label || `#${method?.id ?? ""}`;
}

/** `optionsSource` lookups for the payment fields. Only sources the config provides. */
export function paymentLookups(config) {
  const methods = Array.isArray(config?.paymentMethods) ? config.paymentMethods : [];

  return {
    paymentMethods: methods.map((method) => ({ id: method.id, label: paymentMethodLabel(method) })),
  };
}

export function findPaymentMethod(config, id) {
  if (id === undefined || id === null || id === "") return null;

  return (config?.paymentMethods ?? []).find((method) => String(method.id) === String(id)) ?? null;
}

function isBlank(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

/* The multipart body for submit and resubmit. User-filled fields come from the
   form under their Lookup names; hidden ones come from the config that was on
   screen. A field the Lookup does not list is never sent. */
export function buildPaymentFormData(fields = [], values = {}, config = null) {
  const formData = new FormData();

  fields.forEach((field) => {
    const name = field?.name;

    if (!name || isExcluded(field)) return;

    const fromConfig = SHOWN_CONFIG_VALUES[name];

    const value = fromConfig && field.visible === false ? fromConfig(config) : values[name];

    if (isBlank(value)) return;

    const items = Array.isArray(value) ? value : [value];

    items.forEach((item) => {
      if (isBlank(item)) return;

      formData.append(name, item instanceof Blob ? item : String(typeof item === "string" ? item.trim() : item));
    });
  });

  return formData;
}

/** The new advertisement's id from a create-endpoint response (`data.id`). */
export function createdAdvertisementId(response) {
  const id = response?.data?.id ?? response?.id;

  return id === undefined || id === null || id === "" ? null : String(id);
}

/** The payment template and ids a submit needs, or null when anything is missing. */
export function paymentTarget(formData, advertisementId, { resubmit = false } = {}) {
  const payment = paymentBlockOf(formData);

  if (!payment) return null;

  const url = fillPaymentEndpoint(resubmit ? payment.resubmitEndpoint : payment.submitEndpoint, {
    advertisementType: payment.advertisementType,
    advertisementId,
  });

  if (!url) return null;

  return { url, method: payment.method || "POST" };
}

/* What a failed payment request means for the user. The server's own message
   comes first; the status only supplies wording when it sent none. 409 is the
   documented "price changed / already pending or approved" refusal. */
const PAYMENT_ERROR_COPY = {
  400: "بيانات الدفع غير صحيحة. راجع الحقول وحاول مرة أخرى.",
  401: "انتهت جلستك. سجّل الدخول مرة أخرى ثم أعد المحاولة.",
  403: "ليس لديك صلاحية لإرسال الدفع لهذا الإعلان.",
  404: "لم نجد هذا الإعلان ضمن إعلاناتك.",
  409: "تغيّرت حالة الدفع أو سعره منذ فتح الصفحة. حدّث الصفحة وراجع المبلغ قبل الإرسال.",
  413: "حجم صورة الإيصال أكبر من المسموح.",
  422: "تعذّر قبول بيانات الدفع. راجع الحقول وحاول مرة أخرى.",
  429: "محاولات كثيرة في وقت قصير. انتظر قليلًا ثم أعد المحاولة.",
};

export function paymentErrorText(error, fallback = "تعذّر إرسال الدفع، حاول مرة أخرى.") {
  const status = error?.response?.status;

  if (!error?.response) return "تعذّر الاتصال بالخادم. تأكد من الإنترنت وأعد المحاولة.";

  return apiErrorText(error, PAYMENT_ERROR_COPY[status] ?? fallback) || PAYMENT_ERROR_COPY[status] || fallback;
}

/** Where the user follows an advertisement's payment from, after creation. */
export function adPaymentPagePath({ categoryId, subCategoryId, advertisementId }) {
  if (!categoryId || !subCategoryId || !advertisementId) return null;

  return `/my-ads/${categoryId}/${subCategoryId}/${encodeURIComponent(String(advertisementId))}/payment`;
}
