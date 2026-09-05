import { useContext, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { loginUser } from "../../api/auth/login";
import { reportFormikApiError } from "../../utils/reportApiError";

export default function useLogin() {
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  /* Where the reader was headed before the guard sent them here. Only a
     same-site path is honoured — an absolute URL in router state would be an
     open redirect — and everything else falls back to the home page. */
  const from = (() => {
    const target = location.state?.from;

    const path =
      typeof target === "string"
        ? target
        : target?.pathname
          ? `${target.pathname}${target.search ?? ""}${target.hash ?? ""}`
          : "";

    return path.startsWith("/") && !path.startsWith("//") ? path : "/";
  })();

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },

    validationSchema: Yup.object({
      username: Yup.string()
        .trim()
        .required("اسم المستخدم مطلوب"),

      password: Yup.string()
        .required("كلمة المرور مطلوبة"),
    }),

    onSubmit: (values) => {
      mutate(values);
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: loginUser,

    onSuccess: (response) => {
      const { token, refreshToken, expiration, refreshTokenExpiration, user } = response.data;

      login(token, refreshToken, expiration, refreshTokenExpiration,user);

      toast.success(response.message);

      formik.resetForm();

      navigate(from, { replace: true });
    },

    onError: (error) => {
      reportFormikApiError(error, formik, "فشل تسجيل الدخول");
    },
  });

  return {
    formik,
    showPassword,
    setShowPassword,
    isPending,
  };
}