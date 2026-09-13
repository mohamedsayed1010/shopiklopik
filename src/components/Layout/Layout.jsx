import {
  Suspense,
  lazy,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";

import { PageSpinner } from "../ui/Spinner";

const FloatingActions = lazy(() => import("../ui/FloatingActions"));

import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import SiteHead from "../SiteHead";
import MaintenanceBanner from "../Site/MaintenanceBanner";
import MaintenanceScreen from "../Site/MaintenanceScreen";
import UrgentBar from "../Charity/UrgentBar";
import useSiteSettings from "../../hooks/useSiteSettings";
import { AuthContext } from "../../context/AuthContext";

/** Auth screens are full-bleed: they carry their own branding. */
const BARE_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/** Scroll offset per history entry (`location.key`), for back and forward. */
const scrollPositions = new Map();

export default function Layout() {
  const location = useLocation();

  const { pathname } = location;

  const navigationType = useNavigationType();

  const { token, user, isAdmin } = useContext(AuthContext);

  const { settings } = useSiteSettings();

  const activeKey = useRef(location.key);

  // Claimed before any scrolling below, so a listener still attached for the
  // entry being left cannot record the new page's offset under the old key.
  useLayoutEffect(() => {
    activeKey.current = location.key;
  }, [location.key]);

  // Where each history entry was left, kept up to date while it is showing.
  // Read on the way back, never at leave time: by then the next page has
  // already rendered and the document may be too short to report it.
  useEffect(() => {
    const key = location.key;

    const save = () => {
      if (activeKey.current === key) scrollPositions.set(key, window.scrollY);
    };

    window.addEventListener("scroll", save, { passive: true });

    return () => window.removeEventListener("scroll", save);
  }, [location.key]);

  // React Router keeps the scroll position between routes, which makes a new
  // page look like it opened halfway down — so a new page starts at the top.
  // Back and forward are the exception: they return to where that page was.
  const previousPathname = useRef(null);

  useLayoutEffect(() => {
    const pathChanged = previousPathname.current !== pathname;

    previousPathname.current = pathname;

    const target =
      navigationType === "POP" ? scrollPositions.get(location.key) : undefined;

    if (target === undefined) {
      // A query-string change is the same page: leave the reader where they are.
      if (pathChanged) window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      return undefined;
    }

    /* Cached pages are full height on this render, but a section still
       settling can leave the document short for a few frames. Keep asking
       briefly, and stop the moment the reader scrolls themselves. */
    let frame = 0;

    let attempts = 0;

    const stop = () => cancelAnimationFrame(frame);

    const restore = () => {
      window.scrollTo({ top: target, left: 0, behavior: "instant" });

      attempts += 1;

      if (Math.abs(window.scrollY - target) > 1 && attempts < 30) {
        frame = requestAnimationFrame(restore);
      }
    };

    restore();

    window.addEventListener("wheel", stop, { passive: true, once: true });
    window.addEventListener("touchstart", stop, { passive: true, once: true });

    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
    // Every history entry, so back between two visits to the same path restores
    // too; `pathname` and `navigationType` always change together with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onFirstScroll = () => setHasScrolled(true);

    window.addEventListener("scroll", onFirstScroll, { once: true, passive: true });

    return () => window.removeEventListener("scroll", onFirstScroll);
  }, []);

  const isBare = BARE_ROUTES.includes(pathname);

  const underMaintenance =
    settings.maintenanceMode && !isAdmin && !isBare;

  /* The compose shortcut is offered on the same terms as the navbar's: signed
     in, and not an administrator (admins moderate listings, they do not post
     them). It is also pointless on the compose flow itself. */
  const canCompose =
    Boolean(token) &&
    user?.role !== "admin" &&
    !pathname.startsWith("/create-product");

  const showFloatingActions =
    hasScrolled ||
    (canCompose && window.matchMedia("(min-width: 1024px)").matches);

  const parts = useMemo(
    () => ({
      siteHead: <SiteHead />,
      navbar: <Navbar />,
      urgentBar: <UrgentBar />,
      maintenanceBanner: <MaintenanceBanner />,
      page: (
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      ),
      footer: <Footer />,
    }),
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Favicon and sharing metadata, driven by the platform settings. Renders
          nothing; mounted once here so no page has to think about them. */}
      {parts.siteHead}

      {!isBare && parts.navbar}

      {!isBare && !underMaintenance && parts.urgentBar}

      {!isBare && parts.maintenanceBanner}

      <main className="flex-1">
        {underMaintenance ? (
          <MaintenanceScreen message={settings.maintenanceMessage} />
        ) : (
          parts.page
        )}
      </main>

      {!isBare && parts.footer}

      {/* Nothing to compose while the site is closed. */}
      {!isBare && !underMaintenance && showFloatingActions && (
        <Suspense fallback={null}>
          <FloatingActions canCompose={canCompose} />
        </Suspense>
      )}
    </div>
  );
}
