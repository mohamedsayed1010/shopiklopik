
/** `1600 × 533` -> `"1600 / 533"`, the value an `aspect-ratio` takes. */
function aspectOf(spec, fallback) {
  const width = Number(spec?.width);

  const height = Number(spec?.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || height <= 0) {
    return fallback;
  }

  return `${width} / ${height}`;
}

/* Until the placements have loaded, a slot is drawn at the size every placement
   the API publishes uses (1000 × 500 on phones, 1000 × 200 on desktop), so the
   skeleton does not resize — and push the page down or up — when they arrive. */
const DEFAULT_MOBILE_ASPECT = "2 / 1";

const DEFAULT_DESKTOP_ASPECT = "5 / 1";

const DEFAULT_WIDTH = "1000px";

export function bannerAspectStyle(placement) {
  return {
    "--banner-aspect-mobile": aspectOf(placement?.mobile, DEFAULT_MOBILE_ASPECT),
    "--banner-aspect-desktop": aspectOf(placement?.desktop, DEFAULT_DESKTOP_ASPECT),
  };
}

export const BANNER_FRAME =
  "aspect-[var(--banner-aspect-mobile)] sm:aspect-[var(--banner-aspect-desktop)]";

function widthOf(spec) {
  const width = Number(spec?.width);

  return Number.isFinite(width) && width > 0 ? `${width}px` : DEFAULT_WIDTH;
}

export function bannerWidthStyle(placement) {
  return {
    "--banner-width-mobile": widthOf(placement?.mobile),
    "--banner-width-desktop": widthOf(placement?.desktop),
  };
}

export const BANNER_WIDTH =
  "mx-auto w-[min(100%,var(--banner-width-mobile))] sm:w-[min(100%,var(--banner-width-desktop))]";
