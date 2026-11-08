/* What the details page may offer for a listing, decided from the server.

   The module details DTOs carry no moderation status (production, 2026-11-08:
   the furniture DTO has no status field at all; cars and lost & found carry an
   unrelated numeric `status`). The owner-only ad payment status —
   `GET /api/v2/ads/{type}/{id}/payment` → `advertisementModerationStatus` /
   `advertisementModerationStatusName` — does carry it, for every listing type
   subject to the ad-payment flow (all 18 visible ones), whether payment is
   switched on or off. It answers 404 to anyone but the owner, so it is only
   asked once the record names the signed-in account as its owner.

   For an owner's pending listing the backend answers 404 to
   `/advertisements/{id}/actions`, `/similar`, `/view` and `/favorite` — they
   apply to published listings only. Those requests are not sent while the
   listing is known to be pending, and the controls they back are not offered. */

const PENDING = /^pending$/i;

/** `{ status, name, isPending }` from an AdPaymentStatusDto, or nulls. */
export function moderationFromStatus(statusData) {
  const status =
    typeof statusData?.advertisementModerationStatus === "string"
      ? statusData.advertisementModerationStatus.trim()
      : "";

  const name =
    typeof statusData?.advertisementModerationStatusName === "string"
      ? statusData.advertisementModerationStatusName.trim()
      : "";

  return {
    status: status || null,
    name: name || null,
    isPending: PENDING.test(status),
  };
}

/**
 * Whether the published-only interaction endpoints may be asked.
 *
 * - Not the owner (by the record): yes — public listings only reach anyone
 *   else, and the backend decides as before.
 * - The owner, status still loading: not yet — asking now would be the 404
 *   this avoids; it is a moment's wait.
 * - The owner, status known pending: no.
 * - The owner, status known otherwise, or unavailable (not subject to the
 *   payment flow, or the status read failed): yes, as before.
 */
export function interactionPolicy({ isOwnerByRecord, statusSettled, isPending }) {
  const everything = { askInteractions: true, offerFavorite: true, offerShare: true };

  if (!isOwnerByRecord) return everything;

  if (!statusSettled) return { ...everything, askInteractions: false };

  /* A pending listing's address opens for its owner only — anyone it was
     shared with gets the sign-in wall and then the API's 404 — so it is not
     offered for sharing until it is published. */
  if (isPending) return { askInteractions: false, offerFavorite: false, offerShare: false };

  return everything;
}

/**
 * Report is never offered on one's own listing. The server's `canReport`
 * still decides for everyone else; with no server answer the button stays, as
 * before. This is only what the page offers — the report endpoint authorises
 * the request itself.
 */
export function canOfferReport({ isOwner, hasReported, actions }) {
  if (hasReported || isOwner) return false;

  return actions ? actions.canReport !== false : true;
}
