import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

import useSiteSettings from "../hooks/useSiteSettings";
import { canonicalUrl } from "../seo/siteUrl";
import { robotsFor } from "../seo/routePolicy";

/** Trim to a length a search result will not cut mid-word. */
function clamp(text, max) {
  const value = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!value || value.length <= max) return value;

  const cut = value.slice(0, max);

  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export default function Seo({
  title,
  description,
  /** Absolute image URL for the share preview; the site logo when omitted. */
  image,
  /** "website" | "article" | "product" — what the address represents. */
  type = "website",
  /** Overrides the path-derived directive. Pass `noindex` for a private view. */
  robots,
  /** Overrides the canonical path when the address is not the canonical one. */
  canonicalPath,
  /** Extra tags — JSON-LD, a prev/next link — rendered inside the same Helmet. */
  children,
}) {
  const { pathname } = useLocation();

  const { settings } = useSiteSettings();

  const siteName = settings.siteName || settings.siteNameEn || "";

  /* "الملف الشخصي | شوبيك لوبيك". The suffix is skipped when the title already
     ends with the site name, so a page that spells it out is not repeated. */
  const fullTitle = (() => {
    const base = clamp(title, 70);

    if (!base) return siteName;

    if (!siteName || base.endsWith(siteName)) return base;

    return `${base} | ${siteName}`;
  })();

  /* A page that writes its own description wins; anything else inherits the
     platform's. `SiteHead` used to supply that floor from a second `<Helmet>`,
     which under React 19 stopped acting as a fallback and started appending a
     duplicate tag instead — so the fallback lives here now, in the one place
     that renders the description. */
  const metaDescription = clamp(description || settings.description, 160);

  const url = canonicalUrl(canonicalPath ?? pathname);

  const directive = robots ?? robotsFor(pathname);

  const shareImage = image || settings.logoUrl || "";

  return (
    <Helmet>
      <title>{fullTitle}</title>

      <meta name="robots" content={directive} />

      {/* Google reads this one separately from `robots`. */}
      <meta name="googlebot" content={directive} />

      {metaDescription ? (
        <meta name="description" content={metaDescription} />
      ) : null}

      {url ? <link rel="canonical" href={url} /> : null}

      {/* Open Graph — what a share preview shows. */}
      <meta property="og:type" content={type} />

      <meta property="og:title" content={fullTitle} />

      {metaDescription ? (
        <meta property="og:description" content={metaDescription} />
      ) : null}

      {url ? <meta property="og:url" content={url} /> : null}

      {siteName ? <meta property="og:site_name" content={siteName} /> : null}

      <meta property="og:locale" content="ar_EG" />

      {shareImage ? <meta property="og:image" content={shareImage} /> : null}

      {shareImage ? <meta property="og:image:alt" content={fullTitle} /> : null}

      {/* Twitter/X reads its own namespace and ignores og:* for the card. */}
      <meta
        name="twitter:card"
        content={shareImage ? "summary_large_image" : "summary"}
      />

      <meta name="twitter:title" content={fullTitle} />

      {metaDescription ? (
        <meta name="twitter:description" content={metaDescription} />
      ) : null}

      {shareImage ? <meta name="twitter:image" content={shareImage} /> : null}

      {children}
    </Helmet>
  );
}
