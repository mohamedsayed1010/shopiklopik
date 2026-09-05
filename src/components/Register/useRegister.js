import { useContext, useState } from "react";
import { useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { registerUser } from "../../api/auth/register";
import { referralCodeFromSearch } from "../../utils/referralLink";
import { reportFormikApiError } from "../../utils/reportApiError";

export default function useRegister() {
  const location = useLocation();

  const [initialReferralCode] = useState(
    () => referralCodeFromSearch(location.search) ?? ""
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showRepassword, setShowRepassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: registerUser,

    onSuccess: (response) => {
      const { token, refreshToken, expiration, refreshTokenExpiration, user } = response.data;

      login(token, refreshToken, expiration, refreshTokenExpiration, user);

      toast.success(response.message || "تم إنشاء الحساب بنجاح");

      formik.resetForm();

      navigate("/");
    },

    onError: (error) => {
      reportFormikApiError(error, formik, "تعذّر إنشاء الحساب");
    },
  });

  const formik = useFormik({
    initialValues: {
      firstName: "",
      secondName: "",
      username: "",
      email: "",
      phone: "",
      governorate: "الفيوم",
      center: "",
      password: "",
      confirmPassword: "",
      referralCode: initialReferralCode,
    },

    validationSchema: Yup.object({
      firstName: Yup.string()
        .trim()
        .required("الاسم الأول مطلوب"),

      secondName: Yup.string()
        .trim()
        .required("الاسم الثاني مطلوب"),

      username: Yup.string()
        .trim()
        .required("اسم المستخدم مطلوب"),

      email: Yup.string()
        .trim()
        .email("البريد الإلكتروني غير صحيح")
        .required("البريد الإلكتروني مطلوب"),

      phone: Yup.string()
        .matches(/^01[0125][0-9]{8}$/, "رقم الهاتف غير صحيح")
        .required("رقم الهاتف مطلوب"),

      governorate: Yup.string()
        .trim()
        .required("المحافظة مطلوبة"),

      center: Yup.string()
        .trim()
        .required("المركز مطلوب"),

      password: Yup.string()
        .required("كلمة المرور مطلوبة")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/,
          "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وحرف كبير، وحرف صغير، ورقم، ورمز خاص."
        ),

      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "كلمتا المرور غير متطابقتين")
        .required("تأكيد كلمة المرور مطلوب"),

      /* Optional, and never judged here: whether a code is usable is
         `/api/referrals/resolve/{code}`'s answer, and the server checks it
         again on submit. */
      referralCode: Yup.string().trim(),
    }),

    onSubmit: (values) => {
      const referralCode = values.referralCode?.trim();

      /* Sent only when there is one — an empty string is not a code. */
      mutate(
        referralCode ? { ...values, referralCode } : { ...values, referralCode: undefined }
      );
    },
  });

  return {
    formik,

    showPassword,
    setShowPassword,

    showRepassword,
    setShowRepassword,

    isPending,
  };
}