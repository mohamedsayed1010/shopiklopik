
/** `1600 × 533` -> `"1600 / 533"`, the value an `aspect-ratio` takes. */
function aspectOf(spec, fallback) {
  const width = Number(spec?.width);

  const height = Number(spec?.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || height <= 0) {
    return fallback;
  }

  return `${width} / ${height}`;
}

export function bannerAspectStyle(placement) {
  return {
    "--banner-aspect-mobile": aspectOf(placement?.mobile, "3 / 2"),
    "--banner-aspect-desktop": aspectOf(placement?.desktop, "3 / 1"),
  };
}

export const BANNER_FRAME =
  "aspect-[var(--banner-aspect-mobile)] sm:aspect-[var(--banner-aspect-desktop)]";

function widthOf(spec) {
  const width = Number(spec?.width);

  return Number.isFinite(width) && width > 0 ? `${width}px` : "100%";
}

export function bannerWidthStyle(placement) {
  return {
    "--banner-width-mobile": widthOf(placement?.mobile),
    "--banner-width-desktop": widthOf(placement?.desktop),
  };
}

export const BANNER_WIDTH =
  "mx-auto w-[min(100%,var(--banner-width-mobile))] sm:w-[min(100%,var(--banner-width-desktop))]";
