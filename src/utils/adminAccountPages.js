import { pageKeyOf } from "./adminPermissions";

export const ADMIN_ACCOUNT_EXCLUDED_PAGE_KEYS = new Set([
  "categories",
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
