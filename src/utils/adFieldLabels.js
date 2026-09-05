
/** Generic marketplace vocabulary. Never category layouts — labels only. */
export const FALLBACK_LABELS = {
  /* Lifecycle / metrics */
  views: "عدد المشاهدات",
  viewscount: "عدد المشاهدات",
  visits: "عدد الزيارات",
  createdat: "تاريخ النشر",
  createdon: "تاريخ النشر",
  publishedat: "تاريخ النشر",
  postedat: "تاريخ النشر",
  updatedat: "آخر تحديث",
  modifiedat: "آخر تحديث",
  expireat: "تاريخ الانتهاء",
  expiresat: "تاريخ الانتهاء",
  expirydate: "تاريخ الانتهاء",
  remainingdays: "الأيام المتبقية",
  likes: "الإعجابات",
  likescount: "عدد الإعجابات",
  comments: "التعليقات",
  commentscount: "عدد التعليقات",
  sharescount: "عدد المشاركات",
  status: "حالة الإعلان",
  membersince: "عضو منذ",

  /* Commerce */
  price: "السعر",
  oldprice: "السعر قبل الخصم",
  discount: "الخصم",
  currency: "العملة",
  salary: "الراتب",
  cost: "التكلفة",
  amount: "المبلغ",
  deposit: "المقدم",
  installment: "القسط",
  negotiable: "قابل للتفاوض",
  quantity: "الكمية",
  stock: "المتوفر",
  warranty: "الضمان",
  deliveryavailable: "التوصيل متاح",
  delivery: "التوصيل",
  paymentmethod: "طريقة الدفع",

  /* Identity & contact */
  title: "عنوان الإعلان",
  name: "الاسم",
  fullname: "الاسم",
  ownername: "اسم المعلن",
  sellername: "اسم البائع",
  description: "الوصف",
  phone: "رقم الهاتف",
  phonenumber: "رقم الهاتف",
  mobile: "رقم الهاتف",
  whatsapp: "رقم الواتساب",
  email: "البريد الإلكتروني",
  website: "الموقع الإلكتروني",
  facebook: "فيسبوك",
  instagram: "إنستجرام",

  /* Place */
  governorate: "المحافظة",
  center: "المركز",
  city: "المدينة",
  district: "الحي",
  village: "القرية",
  address: "العنوان",
  location: "الموقع",
  googlemaps: "الموقع على الخريطة",

  /* Common attributes shared across very different categories */
  category: "القسم",
  categoryname: "القسم",
  subcategory: "القسم الفرعي",
  subcategoryname: "القسم الفرعي",
  brand: "الماركة",
  model: "الموديل",
  year: "سنة الصنع",
  condition: "الحالة",
  color: "اللون",
  colors: "الألوان",
  size: "المقاس",
  sizes: "المقاسات",
  material: "الخامة",
  weight: "الوزن",
  height: "الارتفاع",
  width: "العرض",
  length: "الطول",
  area: "المساحة",
  age: "العمر",
  gender: "الجنس",
  type: "النوع",
  features: "المميزات",
  specialization: "التخصص",
  experience: "الخبرة",
  jobfieldgroup: "مجال العمل",
  duration: "المدة",
  purpose: "الغرض",
  notes: "ملاحظات",
};

export const NOISE_KEYS = new Set([
  "id",
  "guid",
  "key",
  "slug",
  "ownerid",
  "userid",
  "createdby",
  "updatedby",
  "deletedby",
  "isdeleted",
  "isactive",
  "isapproved",
  "ispublished",
  "isfeatured",
  "ispinned",
  "isexpired",
  "canrepublish",
  "canedit",
  "candelete",
  "islikedbycurrentuser",
  "isownedbycurrentuser",
  "issavedbycurrentuser",
  "categoryid",
  "subcategoryid",
  "adtype",
  "module",
  "rowversion",
  "concurrencystamp",
  "__v",
]);

const NOISE_KEYS_BY_CATEGORY = {
  10: new Set(["ispremium", "isurgent"]),
};

/** Does this key belong on the details page of this category? */
export function isNoiseKey(key, categoryId) {
  const lower = normalizeKey(key);

  if (NOISE_KEYS.has(lower)) return true;

  return NOISE_KEYS_BY_CATEGORY[categoryId]?.has(lower) === true;
}

/** Suffixes whose label is borrowed from the field they decorate. */
const MIRRORED_SUFFIXES = [
  "namear",
  "nameen",
  "name",
  "labelar",
  "label",
  "titlear",
  "ar",
  "en",
  "text",
  "value",
  "display",
  "url",
  "link",
  "path",
];

/** Suffixes that reshape the borrowed label instead of reusing it as-is. */
const DERIVED_SUFFIXES = [
  { suffix: "count", format: (label) => `عدد ${label}` },
  { suffix: "total", format: (label) => `إجمالي ${label}` },
  { suffix: "date", format: (label) => `تاريخ ${label}` },
  { suffix: "at", format: (label) => `تاريخ ${label}` },
  { suffix: "from", format: (label) => `${label} من` },
  { suffix: "to", format: (label) => `${label} إلى` },
  { suffix: "min", format: (label) => `أقل ${label}` },
  { suffix: "max", format: (label) => `أعلى ${label}` },
];

/** Prefixes that read as a yes/no question about the borrowed label. */
const BOOLEAN_PREFIXES = ["is", "has", "allow", "allows", "accept", "accepts"];

export function normalizeKey(key) {
  return String(key ?? "").toLowerCase();
}

export function resolveLabel(key, getConfigLabel, depth = 0) {
  if (!key || depth > 3) return null;

  const direct = getConfigLabel?.(key);

  if (direct) return direct;

  const lower = normalizeKey(key);

  if (FALLBACK_LABELS[lower]) return FALLBACK_LABELS[lower];

  /* `jobFieldName` → the label of `jobField`. */
  for (const suffix of MIRRORED_SUFFIXES) {
    if (lower.length <= suffix.length || !lower.endsWith(suffix)) continue;

    const base = resolveLabel(
      lower.slice(0, -suffix.length),
      getConfigLabel,
      depth + 1
    );

    if (base) return base;
  }

  /* `imagesCount` → "عدد الصور", `lostDate` → "تاريخ الفقدان". */
  for (const { suffix, format } of DERIVED_SUFFIXES) {
    if (lower.length <= suffix.length || !lower.endsWith(suffix)) continue;

    const base = resolveLabel(
      lower.slice(0, -suffix.length),
      getConfigLabel,
      depth + 1
    );

    if (base) return format(base);
  }

  /* `isRunning` → the label of `running`, phrased by the value (نعم / لا). */
  for (const prefix of BOOLEAN_PREFIXES) {
    if (lower.length <= prefix.length || !lower.startsWith(prefix)) continue;

    const base = resolveLabel(
      lower.slice(prefix.length),
      getConfigLabel,
      depth + 1
    );

    if (base) return base;
  }

  return null;
}

const PLACEHOLDER_TEXT = new Set([
  "unknown",
  "undefined",
  "null",
  "n/a",
  "na",
  "none",
  "-",
  "--",
  "string",
  "غير معروف",
  "غير محدد",
  "لا يوجد",
  "بدون",
]);

export function isMeaningless(value) {
  if (value === null || value === undefined) return true;

  if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed === "" || PLACEHOLDER_TEXT.has(trimmed.toLowerCase());
  }

  if (typeof value === "number") return !Number.isFinite(value) || value === 0;

  if (Array.isArray(value)) return value.length === 0;

  if (typeof value === "object") return Object.keys(value).length === 0;

  return false;
}

export function isUndescribedCode(value, hasConfigField) {
  if (hasConfigField) return false;

  return typeof value === "number" && (value === 0 || value === 1);
}
