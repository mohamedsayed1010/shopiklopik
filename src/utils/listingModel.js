import { formatPrice, formatRelativeTime } from "./format";
import { resolveMediaUrl } from "./mediaUrl";
import { avatarHue, initialsFrom } from "./adModel";

/* Ordered by specificity — the first key carrying a real value wins. */
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
  /* The charity modules title themselves by who is asking — see the same
     addition in `adModel`. A rescue and a blood request publish no `title`. */
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
  /* An Ask & Consult row calls its body `question` and nothing else, so
     without this the card had a title and no text at all — on the grid as
     well as on the social card. */
  "question",
  "details",
  "productDetails",
  "supplyDetails",
  "bio",
  "about",
];

/** Each price-ish key with the noun that actually names it in Arabic. */
const PRICE_KEYS = [
  ["price", "السعر"],
  ["salary", "الراتب"],
  ["rentPrice", "الإيجار"],
  ["monthlyPrice", "الإيجار الشهري"],
  ["dailyPrice", "الإيجار اليومي"],
  ["cost", "التكلفة"],
  ["amount", "المبلغ"],
  ["value", "القيمة"],
];

/** Owner arrives nested on ads, flattened on every other module. */
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
  "businessName",
  "storeName",
  "stallName",
  "companyName",
  "farmName",
  "factoryName",
  "workshopName",
  "fullName",
  "name",
];

const AVATAR_KEYS = [
  "profileImageUrl",
  "profileImage",
  "avatarUrl",
  "avatar",
  "logoUrl",
  "logo",
];

/** Narrowest place first: a centre is more useful than a governorate. */
const LOCATION_KEYS = ["center", "city", "district", "village", "governorate"];

const CREATED_KEYS = ["createdAt", "createdOn", "publishedAt", "postedAt"];

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

/** The one listing route this app serves — see `Routes/index.jsx`. */
const APP_LISTING_PATH = /^\/dynamic\/(\d+)\/(\d+)(?:\/([^/]+))?\/?$/;

export function listingHrefFromRoute(route, id) {
  if (typeof route !== "string") return null;

  let path = route.trim();

  if (!path) return null;

  // Tolerate an absolute URL or a custom scheme; keep whatever path followed.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\/[^/]*(\/.*)?$/i.exec(path);

  if (withScheme) path = withScheme[1] ?? "/";

  // A bare module slug ("ads") is a name, not a path. Only a path can be one.
  if (!path.startsWith("/")) return null;

  const match = APP_LISTING_PATH.exec(path.split(/[?#]/)[0]);

  if (!match) return null;

  const [, categoryId, subCategoryId, tail] = match;

  const adId = tail ?? (id ? String(id) : null);

  return adId ? `/dynamic/${categoryId}/${subCategoryId}/${adId}` : null;
}

function isMeaningless(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  );
}

function pick(source, keys) {
  if (!source) return null;

  for (const key of keys) {
    if (!isMeaningless(source[key])) return source[key];
  }

  return null;
}

function asImageUrl(value) {
  if (typeof value === "string") return resolveMediaUrl(value);

  if (value && typeof value === "object") {
    const url = value.url ?? value.imageUrl ?? value.path ?? value.src;

    if (typeof url === "string") return resolveMediaUrl(url);
  }

  return null;
}

function collectImages(item) {
  const seen = new Set();
  const collected = [];

  const push = (candidate, primary = false) => {
    const url = asImageUrl(candidate);

    if (!url || seen.has(url)) return;

    seen.add(url);

    collected.push({ url, primary: primary || candidate?.isPrimary === true });
  };

  push(item?.primaryImageUrl, true);

  /* The canonical `ListingCardDto` (recently-viewed, favourites, similar) names
     its cover shot differently from the module list rows. */
  push(item?.mainImageUrl, true);

  ["images", "photos", "gallery"].forEach((key) => {
    if (Array.isArray(item?.[key])) item[key].forEach((entry) => push(entry));
  });

  push(item?.imageUrl);
  push(item?.image);
  push(item?.logoUrl);

  collected.sort((a, b) => Number(b.primary) - Number(a.primary));

  return collected.map((entry) => entry.url);
}

function buildSeller(item) {
  const nested = OWNER_OBJECT_KEYS.map((key) => item?.[key]).find(
    (value) => value && typeof value === "object" && !Array.isArray(value)
  );

  const source = nested ?? item ?? {};

  const rawName =
    pick(source, SELLER_NAME_KEYS) ??
    (nested ? pick(item, SELLER_NAME_KEYS) : null);

  const name = rawName ? String(rawName).trim() : null;

  const avatar = asImageUrl(
    pick(source, AVATAR_KEYS) ?? (nested ? pick(item, AVATAR_KEYS) : null)
  );

  return {
    id: source?.id ?? item?.ownerId ?? null,
    name,
    avatar,
    initials: initialsFrom(name),
    hue: avatarHue(name ?? source?.id ?? ""),
    /* Shown only when the API says so. No endpoint publishes a verification
       flag today; the moment one appears under any of these names the badge
       lights up on its own. */
    isVerified:
      source?.isVerified === true ||
      source?.verified === true ||
      item?.isVerified === true,
  };
}

export function listingSellerName(item) {
  return buildSeller(item).name;
}

function buildPrice(item) {
  for (const [key, label] of PRICE_KEYS) {
    const value = item?.[key];

    if (isMeaningless(value)) continue;

    const text =
      typeof value === "number" ? formatPrice(value) : String(value).trim();

    if (!text) continue;

    return { text, label, negotiable: item?.negotiable === true };
  }

  return null;
}

function toCount(...candidates) {
  for (const candidate of candidates) {
    const number = Number(candidate);

    if (Number.isFinite(number)) return number;
  }

  return 0;
}

function toCountOrNull(...candidates) {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") continue;

    const number = Number(candidate);

    if (Number.isFinite(number)) return number;
  }

  return null;
}

export function buildListingCard(item, source = {}) {
  if (!item || typeof item !== "object") return null;

  /* The row's own ids beat the source's: `/api/ads` is one endpoint serving
     four car sub-categories, and the row knows which one it is. */
  const categoryId = item.categoryId ?? source.categoryId ?? null;

  const subCategoryId = item.subCategoryId ?? source.subCategoryId ?? null;

  const id = item.id ?? item.postId ?? null;

  /* The backend's own `route` first, then the row's own ids — see
     `listingHrefFromRoute`. Both are read off this row; module list payloads
     carry no `route` at all and simply take the second path. */
  const href =
    listingHrefFromRoute(item.route, id) ??
    (categoryId && subCategoryId && id
      ? `/dynamic/${categoryId}/${subCategoryId}/${id}`
      : null);

  const rawTitle = pick(item, TITLE_KEYS);

  const description = pick(item, DESCRIPTION_KEYS);

  const createdAt = pick(item, CREATED_KEYS);

  const createdTime = createdAt ? new Date(createdAt).getTime() : NaN;

  const location = [...new Set(
    LOCATION_KEYS.map((key) => item[key]).filter((value) => !isMeaningless(value))
  )]
    .map(String)
    .slice(0, 2)
    .join("، ");

  const seller = buildSeller(item);

  const title = rawTitle ? String(rawTitle).trim() : null;

  return {
    id,
    /* Unique across the whole feed: the same guid can legitimately appear in
       two sources (a sub-category filter and its parent). */
    key: `${source.key ?? "listing"}:${id ?? Math.random().toString(36)}`,
    href,
    module: source.module ?? null,

    categoryId,
    subCategoryId,
    type: Number.isFinite(Number(item.type)) ? Number(item.type) : null,

    /* Backend favourite state. `false` rather than null when the payload is
       silent: an ad nobody has favourited and an ad whose payload does not say
       both draw an empty heart, and the first click asks the server anyway. */
    isFavorite: item.isFavorite === true,

    title: title || "بدون عنوان",
    hasTitle: Boolean(title),
    description: description ? String(description).trim() : null,

    images: collectImages(item),
    price: buildPrice(item),

    location: location || null,
    createdAt: createdAt ?? null,
    timeText: createdAt ? formatRelativeTime(createdAt) : null,
    isNew: Number.isFinite(createdTime) && Date.now() - createdTime < THREE_DAYS,
    isExpired: item.isExpired === true,

    seller,

    category:
      source.categoryName ?? item.categoryNameAr ?? item.categoryName ?? null,
    subCategory:
      source.subCategoryName ??
      item.subCategoryNameAr ??
      item.subCategoryName ??
      null,

    stats: {
      /* `null` when this module's list payload says nothing about views — see
         `toCountOrNull`. The details page writes the real count back into this
         row's cache entry once the view endpoint answers. */
      views: toCountOrNull(item.views, item.viewsCount),
      likes: toCount(item.likesCount, item.likes),
      comments: toCount(item.commentsCount, item.comments),
      /* Null where the payload does not count favourites — same reasoning as
         views: an unreported count is not a zero. */
      favorites: toCountOrNull(item.favoriteCount),
    },

    rating: {
      average: toCountOrNull(item.averageRating),
      count: toCountOrNull(item.ratingsCount),
    },

    canLike: Boolean(source.interactionCollection) && Boolean(id),
    canComment: Boolean(source.interactionCollection) && Boolean(id),

    raw: item,
  };
}

export default buildListingCard;
