import { useEffect, useRef } from "react";

import useSiteSettings from "../hooks/useSiteSettings";
import clearStaticHead from "../seo/clearStaticHead";

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

/**
 * Favicon and head housekeeping. Renders nothing.
 *
 * This used to also emit a `<Helmet>` of site-level sharing metadata as a
 * floor beneath each page's `<Seo>`. Under React 19, Helmet stops managing the
 * head and lets React hoist the tags instead — and hoisting appends without
 * deduplicating by name or property, so that floor stopped being a fallback
 * and became a second, competing set of tags on every page.
 *
 * The floor is not lost: every route renders exactly one `<Seo>`, whose output
 * is a superset of what this emitted, and `<Seo>` now falls back to the same
 * platform settings for the values a page does not spell out itself.
 */
export default function SiteHead() {
  const { settings } = useSiteSettings();

  useFavicon(settings.faviconUrl);

  /* The static tags in `index.html` are the no-JavaScript floor. React has the
     head now, so they are dropped — nothing else removes them under React 19,
     and left in place they duplicate every tag `<Seo>` renders. */
  useEffect(() => {
    clearStaticHead();
  }, []);

  return null;
}
