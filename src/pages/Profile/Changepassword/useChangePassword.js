import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { changePassword } from "../../../api/profile/changePassword";
import { apiMessage } from "../profileCache";

export default function useChangePassword() {
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم تغيير كلمة المرور بنجاح"));
    },

    /* No toast — `ChangePasswordModal` reports this on the fields. */
  });

  return {
    changePasswordMutation,
  };
}
