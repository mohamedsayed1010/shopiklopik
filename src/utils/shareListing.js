import { writeToClipboard } from "./clipboard";

/* Sharing a listing from its details page.

   - The address shared is the listing's own: origin + path. Query and hash are
     page state (`?focus=comments`, a gallery slide), not part of the listing.
   - The native sheet (Web Share API) is used wherever the browser offers it —
     phones, and desktop browsers that implement it.
   - Dismissing the sheet is the reader changing their mind, not a failure: no
     error is shown, and nothing is copied behind their back.
   - Without a native sheet, or if it fails for a reason other than a
     dismissal, the address is copied, and the reader is told which happened.
     A copy that fails too is reported as such, never as a success. */

export function listingShareUrl(location = globalThis.location) {
  if (!location?.origin || !location?.pathname) return "";

  return `${location.origin}${location.pathname}`;
}

export function listingShareText(title) {
  const name = typeof title === "string" && title.trim() ? title.trim() : "";

  return name ? `${name} — على شوبيك لوبيك` : "إعلان على شوبيك لوبيك";
}

/**
 * Outcome: "shared" | "cancelled" | "copied" | "failed".
 * `deps` are injectable for tests: { nav, copy }.
 */
export async function shareListing({ url, title }, { nav = globalThis.navigator, copy = writeToClipboard } = {}) {
  if (!url) return "failed";

  const payload = { title: title || "شوبيك لوبيك", text: listingShareText(title), url };

  const canNative =
    typeof nav?.share === "function" && (typeof nav.canShare !== "function" || nav.canShare(payload));

  if (canNative) {
    try {
      await nav.share(payload);

      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";

      /* NotAllowedError, a broken share target… the copy below still works. */
    }
  }

  return (await copy(url)) ? "copied" : "failed";
}

/** What the reader is told for each outcome (null: nothing to say). */
export function shareFeedback(outcome) {
  if (outcome === "copied") return { kind: "success", text: "تم نسخ رابط الإعلان" };

  if (outcome === "failed") {
    return { kind: "error", text: "تعذّر نسخ الرابط تلقائيًا، انسخه من شريط العنوان." };
  }

  return null;
}
