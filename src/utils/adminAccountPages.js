import { pageKeyOf } from "./adminPermissions";

/* Catalogue pages the admin-accounts screens (create, permissions) never show
   or send. `categories` and `payments` are deliberately NOT here: both are
   admin pages (/admin/categories, /admin/payments) a SuperAdmin must be able to
   grant (product request 2026-11-07). */
export const ADMIN_ACCOUNT_EXCLUDED_PAGE_KEYS = new Set([
  "locations",
  "forms",
  "home",
]);

/** Is this page one the admin-accounts screens are allowed to manage? */
export function isAdminAccountPage(page) {
  return !ADMIN_ACCOUNT_EXCLUDED_PAGE_KEYS.has(pageKeyOf(page));
}

export function adminAccountPages(pages) {
  return (pages ?? []).filter(isAdminAccountPage);
}

export function adminAccountSelection(selection) {
  if (!selection) return selection;

  if (Array.isArray(selection)) return selection.filter(isAdminAccountPage);

  return Object.fromEntries(
    Object.entries(selection).filter(([pageKey]) =>
      isAdminAccountPage(pageKey)
    )
  );
}
