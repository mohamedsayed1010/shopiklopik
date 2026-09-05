import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";

import useSiteSettings from "../hooks/useSiteSettings";

function useFavicon(faviconUrl) {
  const originalRef = useRef(null);

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']");

    if (!link) return;

    if (originalRef.current === null) {
      originalRef.current = link.getAttribute("href") ?? "";
    }

    const next = faviconUrl || originalRef.current;

    if (!next || link.getAttribute("href") === next) return;

    link.setAttribute("href", next);

    /* `type` is declared as png in the markup. A configured icon may be an ico
       or an svg, and a wrong type is worse than none, so it is dropped and the
       browser sniffs the file instead. */
    if (faviconUrl) {
      link.removeAttribute("type");
    }
  }, [faviconUrl]);
}

export default function SiteHead() {
  const { settings } = useSiteSettings();

  useFavicon(settings.faviconUrl);

  const title = settings.siteName || settings.siteNameEn;

  return (
    <Helmet>
      {/* The site-wide floor. A page that mounts `<Seo>` renders after this —
          `SiteHead` sits above the outlet — so its values replace these, and a
          page that mounts none inherits them. */}
      {settings.description ? (
        <meta name="description" content={settings.description} />
      ) : null}

      <meta property="og:type" content="website" />

      <meta property="og:site_name" content={title} />

      <meta property="og:title" content={title} />

      <meta property="og:description" content={settings.description} />

      <meta name="twitter:card" content="summary_large_image" />

      <meta name="twitter:title" content={title} />

      <meta name="twitter:description" content={settings.description} />

      {settings.logoUrl ? (
        <meta property="og:image" content={settings.logoUrl} />
      ) : null}

      {settings.logoUrl ? (
        <meta name="twitter:image" content={settings.logoUrl} />
      ) : null}
    </Helmet>
  );
}
