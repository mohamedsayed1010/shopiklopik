import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import useProfileCompletion from "../../hooks/useProfileCompletion";
import { AUTH_PATHS } from "../../utils/redirectTarget";
import { PageSpinner } from "../ui/Spinner";

/** The one address an account short of its required data may still open. */
export const PROFILE_COMPLETION_PATH = "/profile/edit";

/**
 * An account the application still wants information from gets one destination
 * until it has given it: the profile form.
 *
 * This wraps the route tree's own root — the element every address in the app
 * is a child of — rather than living inside the sign-in screen, which is the
 * only placement that actually holds. A redirect written into `useLogin` would
 * be a suggestion: a typed address, a deep link from a notification, a refresh,
 * the back button or a second tab would all walk straight past it. Here every
 * navigation is decided before the page under it renders.
 *
 * It sits alongside `ProtectedRoute` and `AdminRoute` rather than replacing
 * either: those answer "may this reader open this address", this one answers
 * "is this reader finished signing up". Both still apply.
 *
 * The rule covers administrators too. Nothing in the contract exempts them, and
 * an admin account is a promoted user account holding the same fields.
 */
export default function ProfileCompletionGuard({ children }) {
  const { isAuthenticated } = useContext(AuthContext);

  const location = useLocation();

  const { status } = useProfileCompletion();

  // Signed out: this guard has no opinion. `ProtectedRoute` still has one.
  if (!isAuthenticated) return children;

  /* The form itself is always reachable — including while its own record is
     still loading, because the page renders that state itself. Blocking it
     would leave the reader nowhere to go. */
  if (location.pathname.startsWith(PROFILE_COMPLETION_PATH)) return children;

  if (status === "complete") return children;

  /* A session with nothing stored to judge by — a tab opened straight onto a
     deep link, say. Neither answer is known yet, so neither is acted on: no
     protected page is painted and none is wrongly refused. */
  if (status === "pending") {
    return <PageSpinner label="جارٍ التحقق من بياناتك..." />;
  }

  /* The address being asked for travels along, so finishing the form returns
     the reader to it — except on the sign-in screens, where the address being
     asked for is the sign-in screen itself. Signing in stores the session
     before the router has moved, so this guard can fire while the reader is
     still standing on /login; what they were actually headed for is the
     destination that screen is already carrying. */
  const intended = AUTH_PATHS.includes(location.pathname)
    ? (location.state?.from ?? null)
    : location;

  /* `incomplete`, and `error` with it: a profile that could not be read is not
     a complete one. The form reports that failure and offers a retry.
     `replace` keeps the refused page out of the history, so Back cannot walk
     into it either. */
  return (
    <Navigate to={PROFILE_COMPLETION_PATH} replace state={{ from: intended }} />
  );
}
