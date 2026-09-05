import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { forgotPassword } from "../../api/auth/forgotPassword";
import { verifyResetCode } from "../../api/auth/verifyResetCode";
import { reportFormikApiError } from "../../utils/reportApiError";

export default function useForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");

  const [resetToken, setResetToken] = useState("");

  // ==========================
  // Send Email
  // ==========================

  const forgotMutation = useMutation({
    mutationFn: forgotPassword,

    onSuccess: (response) => {
      toast.success(response.message);

      setResetToken(response.data.resetToken);

      setStep("otp");
    },

    /* "A valid email address is required." names the field this form has, so
       it is shown under the input rather than as a toast over it. */
    onError: (error) => {
      reportFormikApiError(error, emailFormik, "تعذّر إرسال الكود");
    },
  });

  // ==========================
  // Verify OTP
  // ==========================

  const verifyMutation = useMutation({
    mutationFn: (otp) =>
      verifyResetCode(resetToken, otp),

    onSuccess: () => {
      toast.success("تم التحقق من الكود");

      navigate("/reset-password", {
        state: {
          resetToken,
        },
      });
    },

    onError: (error) => {
      reportFormikApiError(error, otpFormik, "الكود غير صحيح");
    },
  });

  // ==========================
  // Email Form
  // ==========================

  const emailFormik = useFormik({
    initialValues: {
      email: "",
    },

    validationSchema: Yup.object({
      email: Yup.string()
        .email("البريد الإلكتروني غير صحيح")
        .required("البريد الإلكتروني مطلوب"),
    }),

    onSubmit: (values) => {
      forgotMutation.mutate(values);
    },
  });

  // ==========================
  // OTP Form
  // ==========================

  const otpFormik = useFormik({
    initialValues: {
      otp: "",
    },

    validationSchema: Yup.object({
      otp: Yup.string().required("الكود مطلوب"),
    }),

    onSubmit: (values) => {
      verifyMutation.mutate(values.otp);
    },
  });

  return {
    step,

    emailFormik,
    otpFormik,

    forgotLoading: forgotMutation.isPending,

    verifyLoading: verifyMutation.isPending,
  };
}