
/** Path prefixes that are one person's own data, or the moderation console. */
export const PRIVATE_PREFIXES = [
  "/admin",
  "/profile",
  "/favorites",
  "/referrals",
  "/payments",
  "/notifications",
  "/create-product",
  "/banner-booking",
];

/** Public, but a search result pointing here would help nobody. */
export const NOINDEX_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export const SITEMAP_PATHS = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
];

/** Does this path fall under a private prefix? */
export function isPrivatePath(path) {
  const clean = String(path ?? "").split(/[?#]/)[0];

  return PRIVATE_PREFIXES.some(
    (prefix) => clean === prefix || clean.startsWith(`${prefix}/`)
  );
}

export function robotsFor(path) {
  const clean = String(path ?? "").split(/[?#]/)[0];

  if (isPrivatePath(clean) || clean.endsWith("/edit")) {
    return "noindex, nofollow";
  }

  if (NOINDEX_PATHS.includes(clean)) return "noindex, follow";

  return "index, follow";
}

export default robotsFor;
