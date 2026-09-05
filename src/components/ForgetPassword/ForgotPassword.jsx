import { Link } from "react-router-dom";
import Seo from "../Seo";
import { Mail, ShieldCheck, ArrowRight, SendHorizonal } from "lucide-react";

import useForgotPassword from "./useForgotPassword";
import AuthLayout from "../ui/AuthLayout";
import Button from "../ui/Button";
import { TextField } from "../ui/TextField";

export default function ForgotPassword() {
  const { step, emailFormik, otpFormik, forgotLoading, verifyLoading } =
    useForgotPassword();

  const isEmailStep = step === "email";

  return (
    <>
      <Seo title="استعادة كلمة المرور" />

      <AuthLayout
        title={isEmailStep ? "استعادة كلمة المرور" : "تأكيد رمز التحقق"}
        subtitle={
          isEmailStep
            ? "أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق."
            : "أدخل الرمز المكوّن من عدة أرقام الذي أرسلناه إلى بريدك الإلكتروني."
        }
      >
        {isEmailStep ? (
          <form onSubmit={emailFormik.handleSubmit} className="space-y-5">
            <TextField
              formik={emailFormik}
              name="email"
              type="email"
              label="البريد الإلكتروني"
              placeholder="name@example.com"
              autoComplete="email"
              dir="ltr"
              icon={Mail}
            />

            <Button type="submit" size="lg" fullWidth loading={forgotLoading}>
              {!forgotLoading && <SendHorizonal size={18} />}
              {forgotLoading ? "جارٍ الإرسال..." : "إرسال رمز التحقق"}
            </Button>
          </form>
        ) : (
          <form onSubmit={otpFormik.handleSubmit} className="space-y-5">
            <TextField
              formik={otpFormik}
              name="otp"
              label="رمز التحقق"
              placeholder="- - - - - -"
              autoComplete="one-time-code"
              dir="ltr"
              icon={ShieldCheck}
              className="[&_input]:text-center [&_input]:text-xl [&_input]:tracking-[0.4em]"
            />

            <Button type="submit" size="lg" fullWidth loading={verifyLoading}>
              {!verifyLoading && <ShieldCheck size={18} />}
              {verifyLoading ? "جارٍ التحقق..." : "تأكيد الرمز"}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowRight size={17} />
          العودة لتسجيل الدخول
        </Link>
      </AuthLayout>
    </>
  );
}
