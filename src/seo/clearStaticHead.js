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
export default function clearStaticHead() {
  if (typeof document === "undefined") return;

  const stale = document.head?.querySelectorAll("[data-rh]");

  if (!stale?.length) return;

  stale.forEach((tag) => tag.remove());
}
