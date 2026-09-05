import * as Yup from "yup";

import {
  EDITABLE_TEXT_FIELDS,
  SOCIAL_NETWORKS,
} from "../../../utils/siteSettings";

/** Maximum lengths, exactly as the request contract declares them. */
export const FIELD_LIMITS = {
  siteName: 150,
  siteNameEn: 150,
  description: 1000,
  phoneNumber: 30,
  whatsAppNumber: 30,
  email: 256,
  address: 500,
  maintenanceMessage: 1000,
  socialUrl: 500,
};

const TOO_LONG = (max) => `الحد الأقصى ${max} حرفًا`;

const LOOSE_URL = /^(?:[a-z][a-z0-9+.-]*:\/\/)?[^\s.]+\.[^\s]{2,}$/i;

const urlRule = Yup.string()
  .trim()
  .max(FIELD_LIMITS.socialUrl, TOO_LONG(FIELD_LIMITS.socialUrl))
  .matches(LOOSE_URL, {
    message: "أدخل رابطًا صحيحًا",
    excludeEmptyString: true,
  });

/** Digits, spaces and the usual separators. Deliberately not country-specific. */
const PHONE = /^[\d\s+()-]{6,}$/;

const phoneRule = (label) =>
  Yup.string()
    .trim()
    .max(FIELD_LIMITS.phoneNumber, TOO_LONG(FIELD_LIMITS.phoneNumber))
    .matches(PHONE, {
      message: `أدخل ${label} صحيحًا`,
      excludeEmptyString: true,
    });

export const settingsValidationSchema = Yup.object({
  siteName: Yup.string()
    .trim()
    .required("اسم الموقع مطلوب")
    .max(FIELD_LIMITS.siteName, TOO_LONG(FIELD_LIMITS.siteName)),

  siteNameEn: Yup.string()
    .trim()
    .max(FIELD_LIMITS.siteNameEn, TOO_LONG(FIELD_LIMITS.siteNameEn)),

  description: Yup.string()
    .trim()
    .max(FIELD_LIMITS.description, TOO_LONG(FIELD_LIMITS.description)),

  phoneNumber: phoneRule("رقم هاتف"),

  whatsAppNumber: phoneRule("رقم واتساب"),

  email: Yup.string()
    .trim()
    .email("أدخل بريدًا إلكترونيًا صحيحًا")
    .max(FIELD_LIMITS.email, TOO_LONG(FIELD_LIMITS.email)),

  address: Yup.string()
    .trim()
    .max(FIELD_LIMITS.address, TOO_LONG(FIELD_LIMITS.address)),

  ...Object.fromEntries(
    SOCIAL_NETWORKS.map((network) => [network.field, urlRule])
  ),

  maintenanceMessage: Yup.string()
    .trim()
    .max(
      FIELD_LIMITS.maintenanceMessage,
      TOO_LONG(FIELD_LIMITS.maintenanceMessage)
    ),
});

export function toFormValues(settings) {
  const values = Object.fromEntries(
    EDITABLE_TEXT_FIELDS.map((field) => [field, settings?.[field] ?? ""])
  );

  values.maintenanceMode = Boolean(settings?.maintenanceMode);

  return values;
}

export const BRANDING_UPLOADS = {
  logo: {
    key: "logo",
    label: "شعار الموقع",
    description:
      "يظهر في ترويسة الموقع والتذييل وبطاقات المشاركة. يُفضّل صورة بخلفية شفافة.",
    accept: "image/*",
    previewClass: "h-20 w-auto max-w-[220px] object-contain",
  },
  favicon: {
    key: "favicon",
    label: "أيقونة الموقع",
    description:
      "الأيقونة الصغيرة في تبويب المتصفح. يُفضّل صورة مربّعة 32×32 أو 64×64.",
    accept: "image/*,.ico",
    previewClass: "h-12 w-12 object-contain",
  },
};

const MB = 1024 * 1024;

/** `"jpg"` / `".jpg"` / `"JPG"` all normalise to `"jpg"`. */
function normalizeExtension(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\./, "")
    .toLowerCase();
}

export function extensionOf(fileName) {
  const match = /\.([^.]+)$/.exec(String(fileName ?? ""));

  return match ? match[1].toLowerCase() : "";
}

export function validateBrandingFile(file, limits) {
  if (!file) return "اختر ملفًا أولًا";

  const allowed = (limits?.imageExtensions ?? [])
    .map(normalizeExtension)
    .filter(Boolean);

  const extension = extensionOf(file.name);

  if (allowed.length && !allowed.includes(extension)) {
    return `الامتدادات المسموح بها: ${allowed.join("، ")}`;
  }

  if (!allowed.length && !file.type.startsWith("image/")) {
    return "الملف يجب أن يكون صورة";
  }

  const maxMb = Number(limits?.imageMaxSizeMb);

  if (Number.isFinite(maxMb) && maxMb > 0 && file.size > maxMb * MB) {
    return `الحجم الأقصى للصورة ${maxMb} ميجابايت`;
  }

  return null;
}

/** `1.5` -> `"1.5 ميجابايت"`. Used by the read-only limits section. */
export function formatMegabytes(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) return "غير محدّد";

  return `${number} ميجابايت`;
}

/** Extensions as a readable list, or a note when the API published none. */
export function formatExtensions(list) {
  const extensions = (list ?? []).map(normalizeExtension).filter(Boolean);

  return extensions.length ? extensions : null;
}
