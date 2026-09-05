import { useCallback, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getAdminPermissionPages,
  getMyAdminPermissions,
} from "../../api/admin/permissions/adminPermissionsEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { AuthContext } from "../../context/AuthContext";
import { decodeToken } from "../../utils/adminIdentity";
import {
  groupPages,
  hasPagePermission,
  normalizeMyPermissions,
  normalizePermissionPages,
  pageForPath,
} from "../../utils/adminPermissions";

export const ADMIN_PERMISSIONS_ROOT = ["admin-permissions"];

export const adminPermissionPagesKey = () => [
  ...ADMIN_PERMISSIONS_ROOT,
  "pages",
];

export const myAdminPermissionsKey = (subject) => [
  ...ADMIN_PERMISSIONS_ROOT,
  "me",
  String(subject ?? ""),
];

const SUBJECT_CLAIMS = [
  "sub",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
];

function subjectOf(token) {
  const claims = decodeToken(token);

  if (!claims) return null;

  for (const claim of SUBJECT_CLAIMS) {
    const value = claims[claim];

    if (typeof value === "string" && value) return value;
  }

  return null;
}

const ADMIN_ROUTE_PREFIX = "/admin";

const ADMIN_HOME = "/admin";

export function useAdminPermissionPages({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminPermissionPagesKey(),
    queryFn: getAdminPermissionPages,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
    retryOnMount: false,
  });

  const pages = useMemo(
    () => normalizePermissionPages(query.data),
    [query.data]
  );

  const groups = useMemo(() => groupPages(pages), [pages]);

  return { pagesQuery: query, pages, groups };
}

export function useMyAdminPermissions({ enabled = true } = {}) {
  const { token } = useContext(AuthContext);

  const subject = useMemo(() => subjectOf(token), [token]);

  const query = useQuery({
    queryKey: myAdminPermissionsKey(subject),
    queryFn: getMyAdminPermissions,
    enabled: enabled && Boolean(token),

    /* An account's own grants are **not** tracked live, by decision: a
       promotion or a permission change takes effect on that account's next
       sign-in. Nothing polls this and nothing pushes to it. */
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: adminRetry,
  });

  const permissions = useMemo(
    () => normalizeMyPermissions(query.data),
    [query.data]
  );

  return { query, ...permissions };
}

export default function useAdminAccess() {
  const { isAdmin: isAdminByClaim } = useContext(AuthContext);

  const {
    query: meQuery,
    resolved,
    isSuperAdmin,
    admin,
    pages,
  } = useMyAdminPermissions();

  const isAdmin = isAdminByClaim || resolved;

  /* Only the pages are read. The query's own status deliberately does not gate
     anything — see `isLoading` below. */
  const { pages: catalog } = useAdminPermissionPages({ enabled: isAdmin });

  const canOpenRoute = useCallback(
    (route) => {
      if (!isAdmin) return false;

      if (isSuperAdmin) return true;

      if (route === ADMIN_HOME) return true;

      /* The answer could not be read — keep the console the administrator had
         before this feature existed, and let the server refuse what it will. */
      if (!resolved) return true;

      if (pageForPath(pages, route, ADMIN_ROUTE_PREFIX)) return true;

      if (
        catalog.length > 0 &&
        pageForPath(catalog, route, ADMIN_ROUTE_PREFIX)
      ) {
        return false;
      }

      return true;
    },
    [isAdmin, isSuperAdmin, resolved, pages, catalog]
  );

  const canOnRoute = useCallback(
    (route, permission) => {
      if (!isAdmin) return false;

      if (isSuperAdmin) return true;

      if (!resolved) return true;

      const granted = pageForPath(pages, route, ADMIN_ROUTE_PREFIX);

      if (granted) {
        return hasPagePermission([granted], granted.pageKey, permission);
      }

      if (
        catalog.length > 0 &&
        pageForPath(catalog, route, ADMIN_ROUTE_PREFIX)
      ) {
        return false;
      }

      return true;
    },
    [isAdmin, isSuperAdmin, resolved, pages, catalog]
  );

  const isLoading = meQuery.isLoading;

  return {
    isAdmin,
    isSuperAdmin,
    admin,
    resolved,
    pages,
    catalog,
    canOpenRoute,
    canOnRoute,
    isLoading,
    meQuery,
  };
}
