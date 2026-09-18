/**
 * Removes the site-level metadata shipped in `index.html` once React has taken
 * over the head.
 *
 * Why this exists
 * ---------------
 * `index.html` carries a floor of `<title>`/`<meta>` tags so that scrapers
 * which do not run JavaScript — Facebook, WhatsApp, X — still read something
 * sensible for every address. Each one is marked `data-rh="true"`.
 *
 * That marker used to be enough on its own: react-helmet-async managed the
 * head imperatively and its `updateTags` step removed every `[data-rh]` tag it
 * found before appending its own. Under React 19 it no longer does. Helmet 3
 * detects React 19 and steps aside (`isReact19`), rendering plain `<title>`
 * and `<meta>` elements and letting React's native metadata hoisting place
 * them. Hoisting appends; it never reconciles against markup that React did
 * not render, and it does not deduplicate meta by name or property.
 *
 * So the static tags survived alongside Helmet's, and every page shipped two
 * titles, several descriptions and contradictory robots directives.
 *
 * This restores the original contract explicitly: the static tags are the
 * pre-hydration floor, and they are dropped the moment the real ones exist.
 *
 * Safe to key on `data-rh` because Helmet's React 19 path never writes it —
 * `syncAllAttributes` manages `<html>`/`<body>` only, under the separate
 * `data-rh-managed` attribute. Anything still carrying `data-rh` came from
 * `index.html`.
 *
 * The favicon `<link>` is deliberately not marked in the markup, so it is not
 * matched here and `useFavicon` keeps ownership of it.
 */
let served;

/* The robots directive the server sent for the address the document was
   loaded at — `{ path, robots }`, or `null`.

   Only trusted when the document's own canonical names that same address. The
   service worker answers some navigations with the cached home document, and
   that document's directive belongs to `/`, not to wherever it was served. */
function readServed() {
  if (served !== undefined) return served;

  served = null;

  if (typeof document === "undefined") return served;

  const robots = document.head
    ?.querySelector('meta[name="robots"][data-rh]')
    ?.getAttribute("content");

  const canonical = document.head
    ?.querySelector('link[rel="canonical"][data-rh]')
    ?.getAttribute("href");

  if (!robots || !canonical) return served;

  try {
    const path = new URL(canonical, window.location.href).pathname;

    if (path === window.location.pathname) served = { path, robots };
  } catch {
    // A canonical that is not a URL says nothing about this address.
  }

  return served;
}

/**
 * The directive a prerendered or server-rendered document declared for this
 * path, so the hydrated page publishes the same one instead of contradicting
 * it. The server decides some directives from data the browser does not load
 * — a section with no public listings is `noindex` (see scripts/prerender.mjs).
 */
export function servedRobotsFor(pathname) {
  const value = readServed();

  return value && value.path === pathname ? value.robots : null;
}

export default function clearStaticHead() {
  if (typeof document === "undefined") return;

  // Read before the tags it reads from are removed.
  readServed();

  const stale = document.head?.querySelectorAll("[data-rh]");

  if (!stale?.length) return;

  stale.forEach((tag) => tag.remove());
}
