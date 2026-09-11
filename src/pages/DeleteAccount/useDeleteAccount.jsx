import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { deleteAccount } from "../../api/account/deleteAccount";
import { AuthContext } from "../../context/AuthContext";
import { apiMessage } from "../Profile/profileCache";

/**
 * The deactivation, and everything that follows it.
 *
 * Only a successful response ends the session — a failure leaves the reader
 * signed in on the form, so they can read what went wrong and try again. That
 * is why the sign-out lives in this hook's own `onSuccess` rather than in the
 * form's: it has to run even though the form unmounts the moment the session
 * it depends on is gone.
 */
export default function useDeleteAccount() {
  const { logout } = useContext(AuthContext);

  const navigate = useNavigate();

  return useMutation({
    mutationFn: deleteAccount,

    onSuccess: async (response) => {
      /* The app's own sign-out: the server-side logout, then the tokens, the
         stored user and the query cache — nothing the old session answered
         survives into the signed-out app. Awaited, so the button stays busy
         until the session is actually gone. */
      await logout();

      navigate("/", { replace: true });

      const hidden = Number(response?.data?.listingsHidden) || 0;

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">
            {apiMessage(response, "تم حذف حسابك بنجاح")}
          </p>

          <p>
            تم تسجيل خروجك من الحساب
            {hidden > 0 ? `، وإخفاء إعلاناتك (${hidden})` : ""}.
          </p>
        </div>,
        { duration: 9000 }
      );
    },

    /* No toast — `DeleteAccountForm` reports failures against its own fields. */
  });
}
