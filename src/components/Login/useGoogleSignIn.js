import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { AuthContext } from "../../context/AuthContext";
import { googleSignIn } from "../../api/auth/googleSignIn";
import { referralCodeFromSearch } from "../../utils/referralLink";
import { redirectTarget, AUTH_PATHS } from "../../utils/redirectTarget";
import reportApiError from "../../utils/reportApiError";

/**
 * Google's ID token, exchanged for this site's own session.
 *
 * Everything after the exchange is the ordinary sign-in path, and deliberately
 * so: the same `AuthContext.login`, the same storage, the same return-to as
 * `useLogin`. Google proves who the reader is; it is not a second kind of
 * session. Where they land afterwards is decided by `ProfileCompletionGuard`,
 * exactly as it is for a password sign-in.
 */
export default function useGoogleSignIn() {
  const { login } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const from = redirectTarget(location.state?.from, { avoid: AUTH_PATHS });

  /* Only what the invitation link actually carried — the sign-in form invents
     no referral of its own. Same source `useRegister` reads. */
  const referralCode = referralCodeFromSearch(location.search) ?? undefined;

  const { mutate, isPending } = useMutation({
    mutationFn: (idToken) => googleSignIn({ idToken, referralCode }),

    onSuccess: (response) => {
      const session = response?.data;

      /* A 2xx without a token is not a sign-in. Storing half an answer would
         leave the app believing in a session the server never issued. */
      if (!session?.token) {
        toast.error(
          response?.message || "تعذّر تسجيل الدخول بحساب جوجل، حاول مرة أخرى"
        );

        return;
      }

      const { token, refreshToken, expiration, refreshTokenExpiration, user } =
        session;

      login(token, refreshToken, expiration, refreshTokenExpiration, user);

      toast.success(response.message || "تم تسجيل الدخول بنجاح");

      navigate(from, { replace: true });
    },

    onError: (error) => {
      /* Stays on the sign-in screen and says why, in the backend's own wording
         when it sent one — 400, 401, 409, 422, 429 and 500 all arrive here and
         are normalised by the same helper every other auth form uses. */
      reportApiError(error, {
        fallback: "تعذّر تسجيل الدخول بحساب جوجل، حاول مرة أخرى",
      });
    },
  });

  return { signIn: mutate, isPending };
}
