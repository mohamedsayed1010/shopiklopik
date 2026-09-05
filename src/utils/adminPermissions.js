
const asArray = (value) => (Array.isArray(value) ? value : []);

const isFilled = (value) => typeof value === "string" && value.trim() !== "";

/** The `ApiResponse` envelope's payload, or the value itself if it is bare. */
export function unwrapEnvelope(payload) {
  if (!payload || typeof payload !== "object") return payload ?? null;

  if (Array.isArray(payload)) return payload;

  return "data" in payload ? payload.data : payload;
}

export function normalizePermission(entry) {
  if (isFilled(entry)) return { value: entry, label: entry };

  if (!entry || typeof entry !== "object") return null;

  const value = [entry.permission, entry.name, entry.key, entry.value].find(
    isFilled
  );

  if (!value) return null;

  const label = [entry.nameAr, entry.name, value].find(isFilled);

  return { value, label };
}

/** A page's identifier, under either of the names the contract may publish. */
export function pageKeyOf(page) {
  if (isFilled(page)) return page;

  if (!page || typeof page !== "object") return null;

  return [page.pageKey, page.key].find(isFilled) ?? null;
}

export function normalizePage(page) {
  const pageKey = pageKeyOf(page);

  if (!pageKey) return null;

  const source = typeof page === "object" && page !== null ? page : {};

  return {
    pageKey,
    name: isFilled(source.name) ? source.name : null,
    nameAr: isFilled(source.nameAr) ? source.nameAr : null,
    route: isFilled(source.route) ? source.route : null,
    icon: isFilled(source.icon) ? source.icon : null,
    group: isFilled(source.group) ? source.group : null,
    permissions: asArray(source.permissions)
      .map(normalizePermission)
      .filter(Boolean),
  };
}

/** What to call a page on screen: Arabic first, then English, then its key. */
export function pageLabel(page) {
  return [page?.nameAr, page?.name].find(isFilled) ?? page?.pageKey ?? "—";
}

/** The vocabulary — `GET /permissions/pages`. */
export function normalizePermissionPages(payload) {
  const data = unwrapEnvelope(payload);

  const source = Array.isArray(data) ? data : asArray(data?.pages);

  return source.map(normalizePage).filter(Boolean);
}

export function groupPages(pages) {
  const groups = [];

  const byName = new Map();

  asArray(pages).forEach((page) => {
    const key = page.group ?? null;

    if (!byName.has(key)) {
      const group = { group: key, pages: [] };

      byName.set(key, group);

      groups.push(group);
    }

    byName.get(key).pages.push(page);
  });

  return groups;
}

export function normalizeMyPermissions(payload) {
  const data = unwrapEnvelope(payload);

  if (!data || typeof data !== "object") {
    return { resolved: false, isSuperAdmin: false, admin: null, pages: [] };
  }

  const list = Array.isArray(data)
    ? data
    : [data.pages, data.allowedPages].find(Array.isArray);

  const admin =
    data.admin && typeof data.admin === "object" ? data.admin : null;

  /* `data.admin.isSuperAdmin` is where the live API puts it. The two fallbacks
     cost nothing and keep a flatter shape working if the contract moves. */
  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin ?? data.isSuperAdmin ?? data.superAdmin ?? false
  );

  return {
    resolved: Array.isArray(list) || Boolean(admin),
    isSuperAdmin,
    admin,
    pages: asArray(list).map(normalizePage).filter(Boolean),
  };
}

/* ------------------------------------------------------------------ */
/* Asking the questions                                                */
/* ------------------------------------------------------------------ */

export function findPage(pages, pageKey) {
  if (!isFilled(pageKey)) return null;

  return asArray(pages).find((page) => page.pageKey === pageKey) ?? null;
}

/** Does this account hold `permission` on `pageKey`? */
export function hasPagePermission(pages, pageKey, permission) {
  const page = findPage(pages, pageKey);

  if (!page) return false;

  if (!isFilled(permission)) return true;

  return page.permissions.some((entry) => entry.value === permission);
}

/** `/admin/ads` covers `/admin/ads/LostItem/{guid}`, but never `/admin/adsx`. */
export function routeCovers(route, pathname) {
  if (!isFilled(route) || !isFilled(pathname)) return false;

  const clean = (value) =>
    String(value).split("?")[0].replace(/\/+$/, "") || "/";

  const base = clean(route);

  const path = clean(pathname);

  return path === base || path.startsWith(base + "/");
}

export function appRouteFor(page, prefix = "") {
  if (!isFilled(page?.route)) return null;

  const route = page.route.startsWith("/") ? page.route : `/${page.route}`;

  return `${prefix}${route}`;
}

export function pageForPath(pages, pathname, prefix = "") {
  let best = null;

  let bestRoute = "";

  asArray(pages).forEach((page) => {
    const route = appRouteFor(page, prefix);

    if (!routeCovers(route, pathname)) return;

    if (!best || route.length > bestRoute.length) {
      best = page;

      bestRoute = route;
    }
  });

  return best;
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export function toPagesPayload(selection) {
  if (!selection) return [];

  const entries = Array.isArray(selection)
    ? selection.map((page) => [pageKeyOf(page), page?.permissions])
    : Object.entries(selection);

  return entries
    .map(([pageKey, permissions]) => ({
      pageKey,
      permissions: Array.from(permissions ?? [])
        .map((entry) =>
          isFilled(entry) ? entry : normalizePermission(entry)?.value
        )
        .filter(isFilled),
    }))
    .filter((page) => isFilled(page.pageKey) && page.permissions.length > 0);
}

/** The picker's `{ [pageKey]: Set }` shape, from a normalized page list. */
export function toSelectionMap(pages) {
  const selection = {};

  asArray(pages).forEach((page) => {
    const key = pageKeyOf(page);

    if (!key) return;

    selection[key] = new Set(
      asArray(page.permissions)
        .map((entry) => normalizePermission(entry)?.value)
        .filter(isFilled)
    );
  });

  return selection;
}
