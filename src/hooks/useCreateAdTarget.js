import { matchPath, useLocation } from "react-router-dom";

const CREATE_AD_ROOT = "/create-product";

const CONTEXT_ROUTES = [
  "/dynamic/:categoryId/:subCategoryId",
  "/category/:categoryId",
];

/** Route ids are numeric here; anything else is not an id this app can use. */
function routeId(value) {
  const text = String(value ?? "").trim();

  if (!/^\d+$/.test(text)) return null;

  const number = Number(text);

  return number > 0 ? String(number) : null;
}

export function createAdTargetFor(pathname) {
  for (const path of CONTEXT_ROUTES) {
    const match = matchPath({ path, end: true }, pathname ?? "");

    if (!match) continue;

    const categoryId = routeId(match.params?.categoryId);

    // Matched the shape but not a usable id — take the general flow.
    if (!categoryId) break;

    const subCategoryId = routeId(match.params?.subCategoryId);

    return subCategoryId
      ? `${CREATE_AD_ROOT}/${categoryId}/${subCategoryId}`
      : `${CREATE_AD_ROOT}/${categoryId}`;
  }

  return CREATE_AD_ROOT;
}

/** The same answer for the address currently on screen. */
export default function useCreateAdTarget() {
  const { pathname } = useLocation();

  return createAdTargetFor(pathname);
}
