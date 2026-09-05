
/** The keys the UI uses to ask for a placement. */
export const PLACEMENT_KEYS = {
  homeSlider1: "home-slider-1",
  homeSlider2: "home-slider-2",
  subCategory: "sub-category",
};

export function resolvePlacement(placements, key) {
  if (!Array.isArray(placements) || placements.length === 0) return null;

  if (key === PLACEMENT_KEYS.subCategory) {
    return placements.find((row) => row.requiresSubCategory === true) ?? null;
  }

  const sliders = placements.filter((row) => row.requiresSubCategory !== true);

  if (key === PLACEMENT_KEYS.homeSlider1) return sliders[0] ?? null;

  if (key === PLACEMENT_KEYS.homeSlider2) return sliders[1] ?? null;

  return null;
}

/** The `location` value to send for a placement key, or `undefined`. */
export function locationForKey(placements, key) {
  return resolvePlacement(placements, key)?.location ?? undefined;
}

export function resolveBannerTarget(banner) {
  const raw = typeof banner?.targetUrl === "string" ? banner.targetUrl.trim() : "";

  if (!raw) return null;

  if (banner.isInternalTarget) {
    // Router paths only. Anything with a scheme or protocol-relative prefix is
    // not an in-app route, whatever the flag says.
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//")) return null;

    return { kind: "internal", to: raw.startsWith("/") ? raw : `/${raw}` };
  }

  let url;

  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  return { kind: "external", href: url.href };
}
