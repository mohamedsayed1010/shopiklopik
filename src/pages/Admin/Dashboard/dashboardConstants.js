
export const CHART_COLORS = {
  primary: "#2a78d6",
  secondary: "#eb6834",
  /* Chrome, one step off the surface. Solid hairlines, never dashed. */
  grid: "#e6e9ef",
  axis: "#667085",
  surface: "#ffffff",
};

/** Presets, plus the custom range the two date inputs drive. */
export const RANGE_PRESETS = [
  { key: "7d", label: "آخر ٧ أيام", days: 7 },
  { key: "30d", label: "آخر ٣٠ يومًا", days: 30 },
  { key: "90d", label: "آخر ٩٠ يومًا", days: 90 },
  { key: "custom", label: "مدة مخصّصة", days: null },
];

export const DEFAULT_RANGE_KEY = "30d";

const isoDay = (date) => date.toISOString().slice(0, 10);

/** `days` ago until today, as the two `YYYY-MM-DD` strings the inputs hold. */
export function presetToDates(days) {
  const to = new Date();

  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  return { from: isoDay(from), to: isoDay(to) };
}

export function rangeToParams({ from, to }) {
  return {
    from: from ? `${from}T00:00:00` : undefined,
    to: to ? `${to}T23:59:59` : undefined,
  };
}

export const IMPLEMENTED_ADMIN_ROUTES = [
  "/admin",
  "/admin/ads",
  "/admin/users",
  "/admin/accounts",
  "/admin/reports",
  "/admin/feedback",
  "/admin/audit-logs",
  "/admin/settings",
  "/admin/payment-methods",
  "/admin/banners",
  "/admin/banner-requests",
];

export function isRouteImplemented(route) {
  if (!route) return false;

  const path = String(route).split("?")[0].replace(/\/$/, "");

  return IMPLEMENTED_ADMIN_ROUTES.includes(path);
}

const STATUS_TONES = {
  pending: "bg-gold-50 text-gold-700 ring-gold-200",
  pendingreview: "bg-gold-50 text-gold-700 ring-gold-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  refunded: "bg-orange-50 text-orange-700 ring-orange-200",
  suspended: "bg-orange-50 text-orange-700 ring-orange-200",
  expired: "bg-slate-100 text-slate-600 ring-slate-300",
};

export function statusTone(status) {
  return (
    STATUS_TONES[String(status ?? "").toLowerCase().replace(/\s/g, "")] ??
    "bg-canvas text-ink-soft ring-line-strong"
  );
}
