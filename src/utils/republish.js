import { formatDate } from "./format";
import { apiErrorText } from "./apiErrors";

/* Whether to offer Republish for a listing: admin list, admin details and the
   owner's card all use this.

   The backend decides; the frontend has no time window of its own. Checked
   live on 2026-11-03:
   - Admin rows (55 ads, 18 types) all carry `canRepublish`, and it equals
     `isExpired || isExpiringSoon` on every one ("soon" covered 1–4 days left).
   - Owner rows (/api/profile/my-listings, 13 rows, 10 types) all carry
     `canRepublish`. It was false on every active row, including 2- and 4-day
     ones, so the owner rule today is "expired only". The UI follows the flag,
     so if the backend widens that rule the button follows.

   Without `canRepublish`, the fallback is the server's own state flags, never
   a client-side count of days: `isExpired` or `isExpiringSoon`. A row with
   neither flag gets no button. */
export function isRepublishEligible(listing) {
  if (!listing) return false;

  if (typeof listing.canRepublish === "boolean") return listing.canRepublish;

  return listing.isExpired === true || listing.isExpiringSoon === true;
}

/** The module type id the backend dispatches on (1 = Advertisement / cars). */
export function listingTypeId(listing) {
  const id = Number(listing?.typeId);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export const ADVERTISEMENT_TYPE_ID = 1;

/* The owner's republish request: one builder for every listing type.

   - Cars (Advertisement, typeId 1): `POST /api/ads/{id}/republish`. It is
     verified live: it finds car records and applies the owner rule (an active
     ad gets a 400 with the reason). It stays until the generic endpoint has
     been verified on a real car record.
   - Every other type: the generic `POST /api/advertisements/{id}/republish?type={typeId}`
     from Swagger, with no documented body. Live (no data could change): it
     needs a login, and for all 64 non-car typeIds it takes a separate,
     type-aware branch. A real record has not been republished through it yet.

   No body is sent to either endpoint. The car endpoint validates any JSON body
   as a full ad and applies it as an edit, and the generic one documents none.
   The id is the module's own record id; no listing has any other id. */
export function ownerRepublishRequest(listing) {
  const typeId = listingTypeId(listing);

  if (!listing?.id || typeId === null) return null;

  const id = encodeURIComponent(listing.id);

  if (typeId === ADVERTISEMENT_TYPE_ID) {
    return { url: `/api/ads/${id}/republish`, params: undefined };
  }

  return { url: `/api/advertisements/${id}/republish`, params: { type: typeId } };
}

const COMMON_STATUS_TEXT = {
  401: "انتهت جلستك. سجّل الدخول مرة أخرى ثم أعد المحاولة.",
  429: "طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم أعد المحاولة.",
};

const STATUS_TEXT = {
  admin: {
    ...COMMON_STATUS_TEXT,
    403: "لا تملك صلاحية إعادة نشر الإعلانات.",
    404: "لم يعد هذا الإعلان موجودًا.",
  },
  owner: {
    ...COMMON_STATUS_TEXT,
    403: "لا يمكنك إعادة نشر إعلان لا تملكه.",
    404: "لم نعثر على هذا الإعلان لإعادة نشره. حدّث الصفحة، وإن تكررت المشكلة تواصل مع الإدارة.",
  },
};

/** The validation family: the server says why this ad is not eligible. */
const EXPLAINED = new Set([400, 409, 422]);

/* A validation answer is the server explaining why the ad cannot be
   republished ("لسه فاضل له 2 يوم"), so its own words are shown. Every other
   status gets fixed text: a 5xx body may carry internals, and a route-level
   404 reads "الرابط المطلوب مش موجود", which tells an owner nothing. */
export function republishErrorText(error, actor = "owner") {
  const status = error?.response?.status;

  const fallback = "تعذّرت إعادة نشر الإعلان. حاول مرة أخرى لاحقًا.";

  if (EXPLAINED.has(status)) return apiErrorText(error, fallback);

  return (STATUS_TEXT[actor] ?? STATUS_TEXT.owner)[status] ?? fallback;
}

function isAwaitingReview(data) {
  if (data?.requiresReview === true) return true;

  const status = String(data?.status ?? "").toLowerCase();

  const moderation = String(data?.moderation?.status ?? "").toLowerCase();

  return status === "pending" || moderation === "pending";
}

/* The admin endpoint answers "تم إعادة نشر الإعلان، وهيظهر بعد مراجعة
   الإدارة" ("it will show after admin review"), but the record comes back
   Active and Approved. That text is wrong for the admin who just did it, so
   the confirmation is built from the new expiry instead. An owner's republish
   may really go back to review: the generic endpoint documents
   `requiresReview`, and its expiry as `endDate` rather than `expireAt`. So
   "valid until" is only claimed when the record is not awaiting review. */
export function republishSuccessText(response, fallbackMessage) {
  const data = response?.data;

  const until = formatDate(data?.expireAt ?? data?.endDate);

  if (until && isAwaitingReview(data)) {
    return `تمت إعادة نشر الإعلان حتى ${until}، وسيظهر بعد مراجعة الإدارة.`;
  }

  if (until) return `تمت إعادة نشر الإعلان، وأصبح ساريًا حتى ${until}.`;

  const message = response?.message ?? data?.message;

  return typeof message === "string" && message.trim()
    ? message
    : fallbackMessage ?? "تمت إعادة نشر الإعلان.";
}
