/* Notification `type` / `action` values.

   Swagger publishes `NotificationType` and `NotificationAction` as bare numbers
   with no names, so every value here is one this app has actually received
   (production, 2026-11-08) — never a guess at the enum:

     type 4  + action 1  "تم إرسال الإعلان"            a car listing (`Advertisement`) submitted
     type 8  + action 1  "تم إرسال بلاغ المفقودات"     a lost & found post submitted
     type 20 + action 1  "تم إرسال إعلان …"            any other module's listing submitted
                                                       (also its "awaiting payment" notice)
     type 21 + action 2  "تم تحديث …"                  a listing edited — back in review
     type 6 / action 4                                  approved
     type 7 / action 5                                  rejected
     type 22                                            deleted

   The three "submitted" types mean the same thing for three kinds of listing;
   they are one category here, so the inbox treats them alike. */
export const NOTIFICATION_TYPE = {
  carSubmitted: 4,
  approved: 6,
  rejected: 7,
  lostFoundSubmitted: 8,
  submitted: 20,
  updated: 21,
  deleted: 22,
};

export const NOTIFICATION_ACTION = {
  approved: 4,
  rejected: 5,
};

/** Every type that announces a listing was submitted and awaits review. */
export const SUBMITTED_TYPES = Object.freeze(
  new Set([
    NOTIFICATION_TYPE.carSubmitted,
    NOTIFICATION_TYPE.lostFoundSubmitted,
    NOTIFICATION_TYPE.submitted,
  ])
);

/** Does this notification carry a listing to act on? */
export function hasListingIdentity(notification) {
  return Boolean(
    notification &&
      notification.referenceId &&
      (notification.listingType != null || notification.referenceType)
  );
}

export function isNoLongerEligible(notification) {
  if (!hasListingIdentity(notification)) return false;

  return (
    notification.type === NOTIFICATION_TYPE.rejected ||
    notification.action === NOTIFICATION_ACTION.rejected ||
    notification.type === NOTIFICATION_TYPE.deleted
  );
}

export function isAwaitingReview(notification) {
  return (
    hasListingIdentity(notification) && SUBMITTED_TYPES.has(notification?.type)
  );
}

export function isEditedAwaitingReview(notification) {
  return (
    hasListingIdentity(notification) &&
    notification?.type === NOTIFICATION_TYPE.updated
  );
}

/* The listing a notification is about, by name.

   `NotificationDto.listingTitle` is in the contract but production does not
   send it. What production does send, for every listing notification of every
   module — cars included — is the title in parentheses at the very end of the
   message: "… قيد المراجعة من الإدارة قبل النشر. (<title>)". That is the
   server's text, not a reconstruction, so it is used when the field is absent.
   Anything else — no listing identity, no trailing parentheses — has no title
   and none is made up. */
const TRAILING_TITLE = /\(([^()]+)\)\s*$/;

export function listingTitleOf(notification) {
  if (!hasListingIdentity(notification)) return null;

  const field =
    typeof notification.listingTitle === "string"
      ? notification.listingTitle.trim()
      : "";

  if (field) return field;

  const message = typeof notification.message === "string" ? notification.message : "";

  const match = TRAILING_TITLE.exec(message);

  const title = match ? match[1].trim() : "";

  return title || null;
}

/** The message without the trailing "(title)", when that title is shown on its own. */
export function messageWithoutListingTitle(notification, title) {
  const message = typeof notification?.message === "string" ? notification.message : "";

  if (!title) return message;

  const match = TRAILING_TITLE.exec(message);

  if (!match || match[1].trim() !== title) return message;

  return message.slice(0, match.index).trimEnd();
}
