import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import useAdminAccess from "../../hooks/admin/useAdminPermissions";
import { PageSpinner } from "../ui/Spinner";

/** The console's own landing page — where a refused address falls back to. */
const ADMIN_HOME = "/admin";

export default function AdminRoute({ children, superAdminOnly = false }) {
  const { token } = useContext(AuthContext);

  const { isAdmin, isSuperAdmin, resolved, canOpenRoute, isLoading } =
    useAdminAccess();

  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  /* The grants have not arrived yet, and on this backend they are also what
     says whether this account is an administrator at all — so nothing can be
     decided before they land. Checked ahead of `isAdmin` for that reason. */
  if (isLoading) {
    return <PageSpinner label="جارٍ التحقق من الصلاحيات..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  /* Refused: back to the console's landing page — unless that is the page
     being refused, which would bounce between the two forever. An account with
     no admin page at all belongs outside the console entirely. */
  const refuge = location.pathname === ADMIN_HOME ? "/" : ADMIN_HOME;

  if (superAdminOnly && resolved && !isSuperAdmin) {
    return <Navigate to={refuge} replace />;
  }

  if (!canOpenRoute(location.pathname)) {
    return <Navigate to={refuge} replace />;
  }

  return children;
}
