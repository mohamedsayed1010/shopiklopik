import { Suspense, lazy, useContext, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import {
  Menu,
  X,
  User,
  LogOut,
  CircleUserRound,
  Heart,
  Plus,
  LayoutDashboard,
  Users,
  Package,
  House,
  Download,
  UserPlus,
  BellRing,
  ScrollText,
  ShieldAlert,
  Star,
  SlidersHorizontal,
  CreditCard,
  Megaphone,
  Gift,
  UserCog,
} from "lucide-react";

import NotificationBell from "../Notifications/NotificationBell";

const Drawer = lazy(() => import("../ui/Drawer"));

const IOSInstallModal = lazy(() => import("../IOSInstallModal/IOSInstallModal"));
import ThemeToggle from "../ui/ThemeToggle";
import { AuthContext } from "../../context/AuthContext";
import { PWAInstallContext } from "../../context/PWAInstallContext";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import useSiteSettings from "../../hooks/useSiteSettings";
import useCreateAdTarget from "../../hooks/useCreateAdTarget";
import useAdminAccess from "../../hooks/admin/useAdminPermissions";

/** Only routes that actually exist — the drawer carries the rest. */
const NAV_LINKS = [
  { to: "/", label: "الرئيسية", end: true },
  { to: "/profile", label: "الملف الشخصي", authOnly: true },
];

const ADMIN_LINKS = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/admin/ads", label: "إدارة الإعلانات", icon: Package },
  { to: "/admin/users", label: "المستخدمين", icon: Users },
  { to: "/admin/accounts", label: "حسابات المسؤولين", icon: UserCog, superAdminOnly: true },
  { to: "/admin/reports", label: "البلاغات", icon: ShieldAlert },
  { to: "/admin/feedback", label: "التقييمات", icon: Star },
  { to: "/admin/referrals", label: "إدارة الدعوات", icon: Gift },
  { to: "/admin/payment-methods", label: "طرق الدفع", icon: CreditCard },
  { to: "/admin/banners", label: "مركز البانرات", icon: Megaphone },
  { to: "/admin/audit-logs", label: "سجل العمليات", icon: ScrollText },
  { to: "/admin/settings", label: "إعدادات المنصة", icon: SlidersHorizontal },
];

function MenuItem({ icon: Icon, label, onClick, to }) {
  const className =
    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-brand-50 hover:text-brand-900 cursor-pointer";

  const content = (
    <>
      <Icon size={19} strokeWidth={1.9} className="shrink-0 text-brand-400" />
      <span>{label}</span>
    </>
  );

  if (to) {
    return (
      <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          `${className} ${isActive ? "bg-brand-50 text-brand-900" : ""}`
        }
      >
        {content}
      </NavLink>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function Navbar() {
  /* Opens the form already on the section being browsed — see
     `useCreateAdTarget`. Falls back to the general flow everywhere else. */
  const createAdTarget = useCreateAdTarget();

  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  /* Which of those sections this account may actually open. The answer comes
     from the server — see `useAdminAccess` — and while it is loading or cannot
     be read, the menu is what it has always been rather than an empty list. */
  const {
    isAdmin: canSeeConsole,
    isSuperAdmin,
    resolved,
    canOpenRoute,
  } = useAdminAccess();

  const navLinks = useMemo(
    () => NAV_LINKS.filter((link) => !link.authOnly || token),
    [token]
  );

  const adminLinks = useMemo(
    () =>
      ADMIN_LINKS.filter((link) => {
        if (link.superAdminOnly && resolved && !isSuperAdmin) return false;

        return canOpenRoute(link.to);
      }),
    [canOpenRoute, isSuperAdmin, resolved]
  );

  /* Branding from the platform settings, off the same cache entry the footer
     reads — no request of its own, and it falls back to the bundled mark and
     wordmark whenever no logo has been uploaded. */
  const { settings } = useSiteSettings();

  const [open, setOpen] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const { installApp, canInstall, isIOS, isStandalone } =
    useContext(PWAInstallContext);

  const closeDrawer = () => setOpen(false);

  /* Latch once opened, so the lazy overlay stays mounted and can animate
     itself closed rather than vanishing. */
  const [drawerMounted, setDrawerMounted] = useState(false);

  if (open && !drawerMounted) setDrawerMounted(true);

  /* Fetch the overlay on the first hint of intent — a pointer entering the
     menu button, or the button taking focus — rather than on a timer during
     load. Costs nothing on a page nobody opens the menu on. */
  const warmDrawer = () => {
    import("../ui/Drawer");
  };

  const handleInstall = () => {
    closeDrawer();

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (canInstall) installApp();
  };

  const handleLogout = async () => {
    await logout();

    closeDrawer();

    navigate("/login", { replace: true });
  };

  const fullName = user ? `${user.firstName} ${user.secondName}` : "";
  const firstLetter = user?.firstName?.charAt(0).toUpperCase() || "";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:h-[68px] lg:px-8">
          <Logo
            size="md"
            tone="light"
            src={settings.logoUrl || undefined}
            name={settings.siteName || undefined}
          />

          {/* Desktop navigation. Shown to everyone now that the home page is
              public — the account-only destinations drop out of the list
              instead of the whole bar disappearing. */}
          {navLinks.length > 0 && (
            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `relative rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-white"
                        : "text-brand-200 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}

                      {/* Active marker sits on the header's bottom edge */}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-3.5 -bottom-[18px] h-0.5 rounded-full bg-gold-300 transition-opacity duration-200 ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {token && (
              <Button
                variant="gold"
                size="sm"
                onClick={() => navigate(createAdTarget)}
                className="max-md:hidden"
              >
                <Plus size={17} strokeWidth={2.5} />
                أضف إعلانك
              </Button>
            )}

            {/* Offered to everyone, signed in or not — the theme is a display
                preference, not an account setting. */}
            <ThemeToggle />

            {token && <NotificationBell />}

            {/* Favourites — the same list the hearts on cards write to. Sits
                beside the bell and matches it, so the two read as one row of
                account actions. */}
            {token && (
              <Link
                to="/favorites"
                aria-label="المفضلة"
                title="المفضلة"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-[background-color,transform] duration-200 hover:bg-white/10 active:scale-95"
              >
                <Heart
                  size={19}
                  strokeWidth={1.9}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(true)}
              onPointerEnter={warmDrawer}
              onFocus={warmDrawer}
              aria-label="فتح القائمة"
              aria-expanded={open}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/15 pe-2.5 ps-1.5 text-white transition-colors duration-200 hover:border-white/25 hover:bg-white/10 sm:gap-2 sm:pe-3"
            >
              <Menu size={18} strokeWidth={2} />

              {token ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-300 text-[13px] font-bold text-brand-900">
                  {firstLetter}
                </span>
              ) : (
                <User size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menu */}
      {drawerMounted && (
        <Suspense fallback={null}>
          <Drawer open={open} onClose={closeDrawer} side="start">
        <div className="relative border-b border-line bg-brand-900 px-5 py-5">
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="إغلاق القائمة"
            className="absolute top-4 cursor-pointer rounded-lg p-1.5 text-brand-200 transition-colors hover:bg-white/10 hover:text-white end-3"
          >
            <X size={20} />
          </button>

          {token ? (
            <div className="flex items-center gap-3 pe-8">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-300 text-lg font-bold text-brand-900">
                {firstLetter}
              </span>

              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{fullName}</p>
                <p className="truncate text-sm text-brand-200">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="pe-8">
              <Logo
                size="sm"
                tone="light"
                to={null}
                src={settings.logoUrl || undefined}
                name={settings.siteName || undefined}
              />

              <p className="mt-3 text-[15px] font-semibold text-white">
                مرحباً بك 👋
              </p>

              <p className="mt-1 text-sm text-brand-200">
                سجّل دخولك للوصول إلى إعلاناتك
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {/* Public: the way back to the marketplace, for readers with an
              account and readers without one alike. */}
          <MenuItem icon={House} label="الرئيسية" to="/" onClick={closeDrawer} />

          {!token && (
            <>
              <MenuItem
                icon={User}
                label="تسجيل الدخول"
                to="/login"
                onClick={closeDrawer}
              />

              <MenuItem
                icon={UserPlus}
                label="إنشاء حساب"
                to="/register"
                onClick={closeDrawer}
              />
            </>
          )}

          {token && (
            <>
              <MenuItem
                icon={Plus}
                label="إضافة إعلان"
                to="/create-product"
                onClick={closeDrawer}
              />

              <MenuItem
                icon={CircleUserRound}
                label="الملف الشخصي"
                to="/profile"
                onClick={closeDrawer}
              />

              <MenuItem
                icon={Gift}
                label="برنامج الدعوات"
                to="/referrals"
                onClick={closeDrawer}
              />

              <MenuItem
                icon={Megaphone}
                label="حجز مساحة إعلانية"
                to="/banner-booking"
                onClick={closeDrawer}
              />

              <MenuItem
                icon={Megaphone}
                label="حجوزاتي الإعلانية"
                to="/my-banner-bookings"
                onClick={closeDrawer}
              />
            </>
          )}

          {/* `canSeeConsole`, not `isAdmin`: this backend issues no role claim,
              so `/me/permissions` is what knows. See `useAdminAccess`. */}
          {token && canSeeConsole && (
            <>
              {adminLinks.map((link) => (
                <MenuItem
                  key={link.to}
                  icon={link.icon}
                  label={link.label}
                  to={link.to}
                  onClick={closeDrawer}
                />
              ))}
            </>
          )}

          {/* Same control as the header's, worded rather than iconic, so the
              drawer reads as a list of choices. Closing on toggle would hide
              the change the user just made, so the drawer stays open. */}
          <ThemeToggle variant="menu" />

          {/* The bell opens the list; this is where the list is configured.
              Signed-in only, since every notification endpoint is authenticated. */}
          {token && (
            <MenuItem
              icon={BellRing}
              label="إعدادات الإشعارات"
              to="/notifications/settings"
              onClick={closeDrawer}
            />
          )}

          {!isStandalone && (
            <>
              <div className="my-2 border-t border-line" />

              <MenuItem
                icon={Download}
                label="تثبيت التطبيق"
                onClick={handleInstall}
              />
            </>
          )}
        </nav>

        {token && (
          <div className="border-t border-line p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut size={18} />
              تسجيل الخروج
            </button>
          </div>
        )}
          </Drawer>
        </Suspense>
      )}

      {showIOSModal && (
        <Suspense fallback={null}>
          <IOSInstallModal
            open={showIOSModal}
            onClose={() => setShowIOSModal(false)}
          />
        </Suspense>
      )}
    </>
  );
}
