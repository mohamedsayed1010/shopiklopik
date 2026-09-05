import { servesPath } from "../../Routes/routeRegistry";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Words that mean "this is about the signed-in person", in either language. */
const PROFILE_HINT = /^(?:profile|myprofile|userprofile|account|myaccount)$/i;

/** Enough to recognise a comment notification without touching the enums. */
const COMMENT_HINT = /comment|reply|تعليق|تعليقات|ردّ|رد على/i;

/** `advertisements` (the module) is served at `/api/ads`. Nothing else differs. */
const MODULE_ALIASES = {
  ad: "advertisements",
  ads: "advertisements",
  advert: "advertisements",
  advertisement: "advertisements",
  advertisements: "advertisements",
};

/** "LostFound" -> "lost-found", which is how the API spells its paths. */
export function toKebab(value) {
  return String(value ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

/** Entity names arrive singular ("Horse"); endpoints are plural ("/horses"). */
export function pluralize(value) {
  const text = String(value ?? "");

  if (!text || /s$/.test(text)) return text;

  if (/[^aeiou]y$/.test(text)) return `${text.slice(0, -1)}ies`;

  if (/(?:ch|sh|x|z|ss)$/.test(text)) return `${text}es`;

  return `${text}s`;
}

export function parseDeepLink(value) {
  if (!value) return null;

  let path = String(value).trim();

  if (!path) return null;

  // Strip "https://host" / "app://host", keeping whatever path followed.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\/[^/]*(\/.*)?$/i.exec(path);

  if (withScheme) path = withScheme[1] ?? "/";

  if (!path.startsWith("/")) path = `/${path}`;

  const hashAt = path.indexOf("#");
  const hash = hashAt >= 0 ? path.slice(hashAt) : "";

  if (hashAt >= 0) path = path.slice(0, hashAt);

  const queryAt = path.indexOf("?");
  const search = queryAt >= 0 ? path.slice(queryAt) : "";
  const pathname = queryAt >= 0 ? path.slice(0, queryAt) : path;

  const segments = pathname.split("/").filter(Boolean);

  return {
    pathname,
    search,
    hash,
    segments,
    // The id is whatever looks like a GUID, wherever it sits in the path.
    id: [...segments].reverse().find((segment) => UUID.test(segment)) ?? null,
    // The first non-id segment names the resource: "/lost-found/{guid}".
    resource: segments.find((segment) => !UUID.test(segment)) ?? null,
  };
}

export function listingPair(notification) {
  const categoryId = Number(notification?.categoryId);

  const subCategoryId = Number(notification?.subCategoryId);

  if (!Number.isInteger(categoryId) || categoryId <= 0) return null;

  if (!Number.isInteger(subCategoryId) || subCategoryId <= 0) return null;

  return { categoryId, subCategoryId };
}

export function readNotification(notification) {
  const link = parseDeepLink(notification?.deepLink);

  const referenceType = notification?.referenceType ?? "";

  const id = link?.id ?? notification?.referenceId ?? null;

  // A comment notification should land on the post *and* open the thread.
  const wantsComments = COMMENT_HINT.test(
    [
      notification?.icon,
      notification?.deepLink,
      notification?.entityName,
      notification?.title,
      notification?.message,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (link && servesPath(link.pathname)) {
    return {
      kind: "app",
      to: `${link.pathname}${link.search}${link.hash}`,
      id,
      wantsComments,
    };
  }

  const profileHint = [referenceType, link?.resource].some(
    (value) => value && PROFILE_HINT.test(String(value).replace(/[-_\s]/g, ""))
  );

  if (profileHint) return { kind: "profile", to: "/profile", id, wantsComments };

  const hint = link?.resource || referenceType || notification?.entityName || "";

  const normalized = toKebab(hint);

  return {
    kind: "listing",
    id,
    wantsComments,
    /* The pair the server stated, when it stated one. A caller that has this
       needs no module lookup at all; one that does not falls through to the
       hints below exactly as before. */
    pair: listingPair(notification),
    // Candidate keys, cheapest and most certain first. `useNotificationTargets`
    // walks these against the read-configs the app has already fetched.
    moduleHints: [
      MODULE_ALIASES[normalized.replace(/-/g, "")] ?? null,
      hint,
      normalized,
    ].filter(Boolean),
    endpointHints: [
      link?.pathname ?? null,
      normalized ? `/api/${normalized}` : null,
      normalized ? `/api/${pluralize(normalized)}` : null,
      MODULE_ALIASES[normalized.replace(/-/g, "")] === "advertisements"
        ? "/api/ads"
        : null,
    ].filter(Boolean),
  };
}
