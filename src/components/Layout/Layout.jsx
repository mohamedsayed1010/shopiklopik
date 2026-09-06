import { Suspense, useContext, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { PageSpinner } from "../ui/Spinner";

import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import FloatingActions from "../ui/FloatingActions";
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

export default function Layout() {
  const { pathname } = useLocation();

  const { token, user, isAdmin } = useContext(AuthContext);

  const { settings } = useSiteSettings();

  // React Router keeps the scroll position between routes, which makes a
  // new page look like it opened halfway down.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

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

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Favicon and sharing metadata, driven by the platform settings. Renders
          nothing; mounted once here so no page has to think about them. */}
      <SiteHead />

      {!isBare && <Navbar />}

      {!isBare && !underMaintenance && <UrgentBar />}

      {!isBare && <MaintenanceBanner />}

      <main className="flex-1">
        {underMaintenance ? (
          <MaintenanceScreen message={settings.maintenanceMessage} />
        ) : (

          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        )}
      </main>

      {!isBare && <Footer />}

      {/* Nothing to compose while the site is closed. */}
      {!isBare && !underMaintenance && (
        <FloatingActions canCompose={canCompose} />
      )}
    </div>
  );
}
