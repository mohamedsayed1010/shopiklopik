const CONFIGURED = import.meta.env.VITE_SITE_URL || "";

function currentOrigin() {
  if (typeof window === "undefined" || !window.location) return "";

  return window.location.origin;
}

/** The origin, never with a trailing slash. */
export function siteOrigin() {
  const value = String(CONFIGURED || currentOrigin() || "");

  return value.replace(/\/+$/, "");
}

export function canonicalUrl(path) {
  const origin = siteOrigin();

  if (!origin) return "";

  const raw = String(path ?? "/");

  // Query and hash never belong in a canonical.
  const clean = raw.split(/[?#]/)[0] || "/";

  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;

  const trimmed = withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : "/";

  return `${origin}${trimmed}`;
}

export default canonicalUrl;
