export const NOTIFICATION_TYPE = {
  approved: 6,
  rejected: 7,
  submitted: 20,
  updated: 21,
  deleted: 22,
};

export const NOTIFICATION_ACTION = {
  approved: 4,
  rejected: 5,
};

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

const SUBMITTED_TYPES = new Set([NOTIFICATION_TYPE.submitted, 4]);

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
