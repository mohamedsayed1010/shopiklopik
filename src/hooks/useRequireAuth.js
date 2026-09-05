import { useCallback, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { AuthContext } from "../context/AuthContext";

/**
 * The gate an authenticated *action* passes through — the heart on a card, a
 * like, a comment. Routes are guarded by `ProtectedRoute`; this is for the
 * controls that stay on screen while signed out, because the card they sit on
 * is public.
 *
 * `requireAuth()` answers whether the caller may proceed. When it may not, the
 * reader is sent to the sign-in form with the address they were on, so the
 * existing return-to flow brings them back — and the caller returns without
 * touching the API, which is the point: no request is sent that the server
 * would only answer with a 401.
 */
export default function useRequireAuth() {
  const { token } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = useCallback(
    (message = "سجّل دخولك للمتابعة") => {
      if (token) return true;

      if (message) toast(message);

      navigate("/login", { state: { from: location } });

      return false;
    },
    [token, navigate, location]
  );

  return { isAuthenticated: Boolean(token), requireAuth };
}
