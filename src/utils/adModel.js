import {
  formatDate,
  formatNumber,
  formatPrice,
  toPhoneHref,
  toWhatsAppHref,
} from "./format";

import {
  isNoiseKey,
  isMeaningless,
  isUndescribedCode,
  normalizeKey,
  resolveLabel,
} from "./adFieldLabels";

import { pickFieldIcon } from "./adFieldIcons";

import { resolveMediaUrl } from "./mediaUrl";

/* Ordered by specificity: the first key that carries a real value wins. */
const TITLE_KEYS = [
  "title",
  "adTitle",
  "postTitle",
  "itemName",
  "jobTitle",
  "productName",
  "paintingName",
  "antiqueName",
  "productsName",
  "suppliedProduct",
  "rescuerName",
  "requesterName",
  "askerName",
  "name",
  "fullName",
  "companyName",
  "storeName",
  "stallName",
  "farmName",
  "factoryName",
  "workshopName",
];

const DESCRIPTION_KEYS = [
  "description",
  "adDescription",
  "postDescription",
  /* Ask & Consult names its body `question` — see the same addition in
     `listingModel`. Without it the details page printed no question. */
  "question",
  "details",
  "productDetails",
  "supplyDetails",
  "bio",
  "about",
  "notes",
];

const PRICE_KEYS = [
  "price",
  "salary",
  "cost",
  "amount",
  "rentPrice",
  "dailyPrice",
  "monthlyPrice",
  "value",
];

/** Owner may arrive nested (ads) or flattened onto the row (most modules). */
const OWNER_OBJECT_KEYS = [
  "owner",
  "seller",
  "user",
  "publisher",
  "advertiser",
  "createdByUser",
  "postedBy",
];

const SELLER_NAME_KEYS = [
  "ownerName",
  "sellerName",
  "advertiserName",
  "publisherName",
  "employerName",
  "merchantName",
  "traderName",
  "supplierName",
  "applicantName",
  "artistName",
  "storeName",
  "stallName",
  "companyName",
  "farmName",
  "factoryName",
  "workshopName",
  "fullName",
  "name",
];

const PHONE_KEYS = ["phoneNumber", "phone", "mobile", "contactNumber", "tel"];

const WHATSAPP_KEYS = ["whatsApp", "whatsapp", "whatsAppNumber", "whatsappNumber"];

const EMAIL_KEYS = ["email", "emailAddress", "contactEmail"];

const WEBSITE_KEYS = ["website", "websiteUrl", "siteUrl"];

const AVATAR_KEYS = [
  "profileImageUrl",
  "profileImage",
  "avatarUrl",
  "avatar",
  "logoUrl",
  "logo",
  "imageUrl",
];

const LOCATION_KEYS = ["governorate", "center", "city", "district", "village"];

const ADDRESS_KEYS = [
  "detailedAddress",
  "address",
  "fullAddress",
  "streetAddress",
];

const MAP_KEYS = ["googleMaps", "googleMapsUrl", "mapUrl", "mapsLink"];

const CREATED_KEYS = ["createdAt", "createdOn", "publishedAt", "postedAt"];

const EXPIRY_KEYS = ["expireAt", "expiresAt", "expiryDate", "expirationDate"];

/** "What kind of posting is this" — rendered as a badge, not a spec row. */
const HIGHLIGHT_KEYS = ["listingType", "postType", "saleType"];

const MEDIA_KEYS = new Set([
  "images",
  "image",
  "imageurl",
  "primaryimageurl",
  "photos",
  "gallery",
  "logo",
  "logourl",
  "profileimage",
  "profileimageurl",
  "avatar",
  "avatarurl",
  "video",
  "videourl",
  "introvideo",
  "introvideourl",
  "attachments",
]);

const VIDEO_KEYS = ["videoUrl", "video", "introVideo", "introVideoUrl"];

const META_KEYS = new Set([
  "views",
  "viewscount",
  "likes",
  "likescount",
  "comments",
  "commentscount",
  "remainingdays",
  "updatedat",
  "modifiedat",
  "status",
  "negotiable",
]);

const PRICE_PATTERN = /price|salary|cost|amount|deposit|installment|سعر|راتب|تكلفة|مبلغ/i;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]|$)/;

const ABSOLUTE_URL = /^https?:\/\//i;

const MIRROR_SUFFIX = /(namear|nameen|name|labelar|label|titlear|ar|en|text|value|display)$/;

function baseKeyOf(key) {
  const lower = normalizeKey(key);

  const match = lower.match(MIRROR_SUFFIX);

  if (!match) return null;

  const base = lower.slice(0, -match[0].length);

  return base.length > 1 ? base : null;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function pick(source, keys) {
  if (!source) return { key: null, value: undefined };

  for (const key of keys) {
    const value = source[key];

    if (!isMeaningless(value)) return { key, value };
  }

  return { key: null, value: undefined };
}

function asUrl(value) {
  if (typeof value === "string") return resolveMediaUrl(value);

  if (value && typeof value === "object") {
    const url = value.url ?? value.imageUrl ?? value.path ?? value.src;

    if (typeof url === "string") return resolveMediaUrl(url);
  }

  return null;
}

function asLink(value) {
  return typeof value === "string" && ABSOLUTE_URL.test(value.trim())
    ? value.trim()
    : null;
}

/** Photos come back as bare strings, `{ url, isPrimary }` rows, or both. */
function collectMedia(data) {
  const images = [];
  const seen = new Set();

  const push = (candidate, isPrimary = false) => {
    const url = asUrl(candidate);

    if (!url || seen.has(url)) return;

    seen.add(url);

    images.push({
      url,
      isPrimary: isPrimary || candidate?.isPrimary === true,
    });
  };

  push(data?.primaryImageUrl, true);

  ["images", "photos", "gallery"].forEach((key) => {
    if (Array.isArray(data?.[key])) data[key].forEach((entry) => push(entry));
  });

  push(data?.imageUrl);
  push(data?.image);

  // The primary photo opens the gallery — sellers choose it deliberately.
  images.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  const videos = [];

  VIDEO_KEYS.forEach((key) => {
    const url = asUrl(data?.[key]);

    if (url && !videos.includes(url)) videos.push(url);
  });

  return { images: images.map((entry) => entry.url), videos };
}

function resolveOptionLabel(field, value, lookups, options) {
  if (!field) return null;

  const target = String(value).toLowerCase();

  const inline = Array.isArray(field.options) ? field.options : null;

  if (inline) {
    const match = inline.find(
      (option) =>
        String(option?.value).toLowerCase() === target ||
        String(option?.labelEn ?? "").toLowerCase() === target
    );

    if (match?.label) return match.label;
  }

  if (!field.optionsSource) return null;

  const list = lookups?.[field.optionsSource] ?? options?.[field.optionsSource];

  if (!Array.isArray(list)) return null;

  const match = list.find((option) =>
    [option?.id, option?.value, option?.code, option?.name, option?.nameEn].some(
      (candidate) =>
        candidate !== undefined &&
        candidate !== null &&
        String(candidate).toLowerCase() === target
    )
  );

  if (!match) return null;

  return match.name ?? match.nameAr ?? match.label ?? match.title ?? null;
}

/** Turns one scalar into `{ text, href }` — never into markup. */
function formatScalar(key, value, field, context) {
  if (typeof value === "boolean") return { text: value ? "نعم" : "لا" };

  const optionLabel = resolveOptionLabel(
    field,
    value,
    context.lookups,
    context.options
  );

  if (optionLabel) return { text: optionLabel };

  if (typeof value === "number") {
    // A model year is an identifier, not a quantity: "2020", never "2,020".
    if (/year/i.test(key) && Number.isInteger(value) && value > 1000) {
      return { text: String(value) };
    }

    return {
      text: PRICE_PATTERN.test(key)
        ? formatPrice(value) ?? formatNumber(value)
        : formatNumber(value),
    };
  }

  const text = String(value);

  if (ISO_DATE.test(text)) return { text: formatDate(text) };

  if (ABSOLUTE_URL.test(text)) return { text, href: text };

  return { text };
}

/** Arrays of lookup rows (features, sizes, colors) read best as chips. */
function collectChipValues(list) {
  return list
    .map((entry) => {
      if (entry === null || entry === undefined) return null;

      if (typeof entry === "object") {
        return (
          entry.name ??
          entry.nameAr ??
          entry.label ??
          entry.title ??
          entry.text ??
          null
        );
      }

      return String(entry);
    })
    .filter((entry) => !isMeaningless(entry));
}

/* ------------------------------------------------------------------ */
/* Seller                                                              */
/* ------------------------------------------------------------------ */

/** Initials keep the avatar elegant when the seller never uploaded a photo. */
export function initialsFrom(name) {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "؟";

  if (words.length === 1) return words[0].slice(0, 2);

  return `${words[0][0]}${words[1][0]}`;
}

/** A stable hue per seller, so the same person keeps the same avatar colour. */
export function avatarHue(seed) {
  const text = String(seed ?? "");

  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 360;
  }

  return hash;
}

function buildSeller(data, consumed) {
  const nested = OWNER_OBJECT_KEYS.map((key) => data?.[key]).find(
    (value) => value && typeof value === "object" && !Array.isArray(value)
  );

  if (nested) {
    OWNER_OBJECT_KEYS.forEach((key) => {
      if (data?.[key] === nested) consumed.add(normalizeKey(key));
    });
  }

  const source = nested ?? data ?? {};

  const nameEntry = pick(source, SELLER_NAME_KEYS);

  const fallbackName = nested ? null : pick(data, SELLER_NAME_KEYS);

  const name = nameEntry.value ?? fallbackName?.value ?? null;

  // On flat payloads the seller's name doubles as a data field — consume it so
  // it is not printed twice.
  if (!nested && nameEntry.key) consumed.add(normalizeKey(nameEntry.key));

  const phoneEntry = pick(source, PHONE_KEYS);

  const phone = phoneEntry.value ?? pick(data, PHONE_KEYS).value ?? null;

  const whatsappEntry = pick(source, WHATSAPP_KEYS);

  const whatsappNumber =
    whatsappEntry.value ?? pick(data, WHATSAPP_KEYS).value ?? null;

  const email = pick(source, EMAIL_KEYS).value ?? pick(data, EMAIL_KEYS).value;

  const website = pick(source, WEBSITE_KEYS).value ?? pick(data, WEBSITE_KEYS).value;

  PHONE_KEYS.concat(WHATSAPP_KEYS, EMAIL_KEYS, WEBSITE_KEYS).forEach((key) =>
    consumed.add(normalizeKey(key))
  );

  const avatar = asUrl(pick(source, AVATAR_KEYS).value ?? pick(data, AVATAR_KEYS).value);

  const memberSince = pick(source, CREATED_KEYS).value ?? null;

  const location = LOCATION_KEYS.map((key) => source?.[key])
    .filter((value) => !isMeaningless(value))
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(" — ");

  return {
    id: source?.id ?? data?.ownerId ?? null,
    name: name ? String(name).trim() : null,
    phone: phone ? String(phone).trim() : null,
    phoneHref: toPhoneHref(phone),
    whatsappHref: toWhatsAppHref(whatsappNumber ?? phone),
    email: isMeaningless(email) ? null : String(email).trim(),
    website: asLink(website),
    avatar,
    // Only meaningful for a nested profile: on flat rows this timestamp is the
    // ad's own date, and claiming it as a join date would be a lie.
    memberSince: nested ? memberSince : null,
    location: location || null,
    hasProfile: Boolean(nested),
  };
}

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

export function buildAdModel({ data, config, schema, options = {} }) {
  if (!data || typeof data !== "object") return null;

  const consumed = new Set();

  const getField = (key) => schema?.getField?.(key) ?? null;

  const getConfigLabel = (key) => {
    const field = getField(key);

    return field?.label ?? field?.labelEn ?? null;
  };

  const labelFor = (key) => resolveLabel(key, getConfigLabel);

  const context = { lookups: schema?.lookups ?? {}, options };

  const consume = (...keys) =>
    keys.filter(Boolean).forEach((key) => consumed.add(normalizeKey(key)));

  /* ---- Headline ------------------------------------------------- */

  const titleEntry = pick(data, TITLE_KEYS);

  const title = titleEntry.value ? String(titleEntry.value).trim() : null;

  consume(titleEntry.key);

  const descriptionEntry = pick(data, DESCRIPTION_KEYS);

  const description = descriptionEntry.value
    ? String(descriptionEntry.value).trim()
    : null;

  consume(descriptionEntry.key);

  /* ---- Media ----------------------------------------------------- */

  const { images, videos } = collectMedia(data);

  MEDIA_KEYS.forEach((key) => consumed.add(key));

  /* ---- Price ----------------------------------------------------- */

  const priceEntry = pick(data, PRICE_KEYS);

  consume(priceEntry.key, "negotiable");

  const priceField = priceEntry.key ? getField(priceEntry.key) : null;

  const priceApplicable = PRICE_KEYS.some((key) => Boolean(getField(key)));

  const price =
    priceEntry.value === undefined
      ? null
      : {
          raw: priceEntry.value,
          text:
            typeof priceEntry.value === "number"
              ? formatPrice(priceEntry.value)
              : String(priceEntry.value),
          // "السعر (جنيه)" → "السعر": the unit already lives in the amount.
          label:
            (priceField?.label ?? labelFor(priceEntry.key) ?? "السعر")
              .replace(/\s*\([^)]*\)\s*$/, "")
              .trim() || "السعر",
          negotiable: data.negotiable === true,
        };

  /* ---- Seller ---------------------------------------------------- */

  const seller = buildSeller(data, consumed);

  /* ---- Place & time ---------------------------------------------- */

  const locationParts = LOCATION_KEYS.map((key) => data[key]).filter(
    (value) => !isMeaningless(value)
  );

  consume(...LOCATION_KEYS);

  const addressEntry = pick(data, ADDRESS_KEYS);

  consume(...ADDRESS_KEYS);

  const addressText = isMeaningless(addressEntry.value)
    ? null
    : String(addressEntry.value).trim();

  // Some modules only carry a free-text address — it becomes the location so
  // the header is never left without a place.
  const location =
    [...new Set(locationParts.map(String))].join(" — ") || addressText;

  const mapEntry = pick(data, MAP_KEYS);

  consume(...MAP_KEYS);

  const createdEntry = pick(data, CREATED_KEYS);

  consume(...CREATED_KEYS);

  const expiryEntry = pick(data, EXPIRY_KEYS);

  consume(...EXPIRY_KEYS);

  /* ---- Badges ---------------------------------------------------- */

  const badges = [];

  const categoryName =
    config?.category?.nameAr ?? config?.category?.name ?? data.categoryName;

  const subCategoryName =
    config?.subCategory?.nameAr ??
    config?.subCategory?.name ??
    data.subCategoryName;

  if (!isMeaningless(categoryName)) {
    badges.push({ key: "category", text: String(categoryName), tone: "brand" });
  }

  if (
    !isMeaningless(subCategoryName) &&
    String(subCategoryName) !== String(categoryName)
  ) {
    badges.push({
      key: "subCategory",
      text: String(subCategoryName),
      tone: "soft",
    });
  }

  consume("categoryName", "subCategoryName");

  HIGHLIGHT_KEYS.forEach((key) => {
    const value = data[key];

    consume(key, `${key}Name`);

    if (isMeaningless(value)) return;

    const label =
      resolveOptionLabel(getField(key), value, context.lookups, options) ??
      (isMeaningless(data[`${key}Name`]) ? null : String(data[`${key}Name`]));

    if (label) badges.push({ key, text: label, tone: "gold" });
  });

  /* A sub-category and a posting type often carry the same words ("ضايع مني"
     is both). Showing the same badge twice looks like a rendering bug. */
  const seenBadges = new Set();

  const uniqueBadges = badges.filter((badge) => {
    if (seenBadges.has(badge.text)) return false;

    seenBadges.add(badge.text);

    return true;
  });

  /* ---- Engagement metrics ---------------------------------------- */

  const meta = {
    views: Number(data.views ?? data.viewsCount) || 0,
    likes: Number(data.likesCount ?? data.likes) || 0,
    comments: Number(data.commentsCount ?? data.comments) || 0,
    remainingDays: Number(data.remainingDays),
    createdAt: createdEntry.value ?? null,
    expireAt: expiryEntry.value ?? null,
    isExpired: data.isExpired === true,
  };

  META_KEYS.forEach((key) => consumed.add(key));

  /* ---- Specifications -------------------------------------------- */

  const specs = [];
  const chipGroups = [];
  const objectGroups = [];

  Object.entries(data).forEach(([key, value]) => {
    const lower = normalizeKey(key);

    if (consumed.has(lower) || isNoiseKey(lower, config?.category?.id)) return;

    if (isMeaningless(value)) return;

    // A `<field>Name` / `<field>Ar` companion is the readable form of this
    // key — let the companion speak and drop the raw code.
    const hasCompanion = ["Name", "NameAr", "Ar"].some(
      (suffix) => !isMeaningless(data[`${key}${suffix}`])
    );

    if (hasCompanion) return;

    // `workshopTypeName` borrows the description of `workshopType`.
    const field = getField(key) ?? getField(baseKeyOf(key));

    const label = labelFor(key);

    if (!label) return;

    if (Array.isArray(value)) {
      const chips = collectChipValues(value);

      if (chips.length > 0) chipGroups.push({ key, label, chips });

      return;
    }

    if (typeof value === "object") {
      const rows = Object.entries(value)
        .map(([nestedKey, nestedValue]) => {
          if (isMeaningless(nestedValue) || typeof nestedValue === "object") {
            return null;
          }

          const nestedLabel = labelFor(nestedKey);

          if (!nestedLabel) return null;

          return {
            key: nestedKey,
            label: nestedLabel,
            icon: pickFieldIcon(nestedKey, nestedLabel),
            ...formatScalar(nestedKey, nestedValue, getField(nestedKey), context),
          };
        })
        .filter(Boolean);

      if (rows.length > 0) objectGroups.push({ key, label, rows });

      return;
    }

    if (isUndescribedCode(value, Boolean(field))) return;

    const formatted = formatScalar(key, value, field, context);

    if (isMeaningless(formatted.text)) return;

    specs.push({
      key,
      label,
      section: field?.section ?? null,
      order: Number.isFinite(field?.order) ? field.order : 9999,
      icon: pickFieldIcon(key, label),
      ...formatted,
    });
  });

  /* Two keys can legitimately resolve to the same Arabic label (a code and
     its group, for instance). The first one is the specific one. */
  const seenLabels = new Set();

  const uniqueSpecs = specs.filter((spec) => {
    if (seenLabels.has(spec.label)) return false;

    seenLabels.add(spec.label);

    return true;
  });

  /* Sections come from the create form, so the details page groups fields the
     same way the publishing form did. */
  const sectionOrder = schema?.sectionOrder ?? [];

  const grouped = new Map();

  uniqueSpecs.forEach((spec) => {
    const section = spec.section ?? "";

    if (!grouped.has(section)) grouped.set(section, []);

    grouped.get(section).push(spec);
  });

  const specGroups = [...grouped.entries()]
    .map(([section, items]) => ({
      key: section || "__general__",
      title: section || null,
      items: items.sort((a, b) => a.order - b.order),
      rank: section ? sectionOrder.indexOf(section) : -1,
    }))
    .sort((a, b) => {
      const left = a.rank === -1 ? Number.MAX_SAFE_INTEGER : a.rank;
      const right = b.rank === -1 ? Number.MAX_SAFE_INTEGER : b.rank;

      return left - right;
    });

  return {
    title: title ?? "بدون عنوان",
    hasTitle: Boolean(title),
    description,
    images,
    videos,
    price,
    priceApplicable: priceApplicable || Boolean(price),
    seller,
    location,
    address: addressText && addressText !== location ? addressText : null,
    mapUrl: asLink(mapEntry.value),
    badges: uniqueBadges,
    meta,
    specGroups,
    chipGroups,
    objectGroups,
    specCount: uniqueSpecs.length,
  };
}

export default buildAdModel;
