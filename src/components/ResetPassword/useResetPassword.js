import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

import { resetPassword } from "../../api/auth/resetPassword";
import { reportFormikApiError } from "../../utils/reportApiError";

export default function useResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = location.state?.resetToken;

  const { mutate, isPending } = useMutation({
    mutationFn: (values) =>
      resetPassword(resetToken, values),

    onSuccess: (response) => {
      toast.success(response.message);

      formik.resetForm();

      navigate("/login");
    },

    onError: (error) => {
      reportFormikApiError(error, formik, "تعذّر تغيير كلمة المرور");
    },
  });

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },

    validationSchema: Yup.object({
      newPassword: Yup.string()
        .required("كلمة المرور مطلوبة")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/,
          "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وحرف كبير، وحرف صغير، ورقم، ورمز خاص."
        ),

      confirmPassword: Yup.string()
        .oneOf(
          [Yup.ref("newPassword")],
          "كلمتا المرور غير متطابقتين"
        )
        .required("تأكيد كلمة المرور مطلوب"),
    }),

    onSubmit: (values) => {
      mutate(values);
    },
  });

  return {
    formik,
    isPending,
    hasResetToken: Boolean(resetToken),
  };
}