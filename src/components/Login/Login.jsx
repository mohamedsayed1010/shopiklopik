import { Link } from "react-router-dom";
import Seo from "../Seo";
import { User, Lock, ArrowLeft } from "lucide-react";

import useLogin from "./useLogin";
import GoogleSignIn from "./GoogleSignIn";
import AuthLayout from "../ui/AuthLayout";
import Button from "../ui/Button";
import { TextField } from "../ui/TextField";

export default function Login() {
  const { formik, isPending } = useLogin();

  return (
    <>
      <Seo
        title="تسجيل الدخول"
        description="سجّل الدخول إلى حسابك لمتابعة إعلاناتك ومفضلتك ورسائل المشترين."
      />

      <AuthLayout
        title="تسجيل الدخول"
        subtitle="مرحباً بعودتك. سجّل الدخول لمتابعة إعلاناتك."
      >
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <TextField
            formik={formik}
            name="username"
            label="اسم المستخدم"
            placeholder="أدخل اسم المستخدم"
            autoComplete="username"
            icon={User}
          />

          <TextField
            formik={formik}
            name="password"
            type="password"
            label="كلمة المرور"
            placeholder="أدخل كلمة المرور"
            autoComplete="current-password"
            icon={Lock}
            labelAction={
              <Link
                to="/forgot-password"
                className="text-[13px] font-medium text-brand-600 transition-colors duration-200 hover:text-brand-900"
              >
                نسيت كلمة المرور؟
              </Link>
            }
          />

          <div className="pt-2">
            <Button type="submit" size="lg" fullWidth loading={isPending}>
              {isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </div>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs font-medium text-muted">أو</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* Renders nothing at all when the backend says Google sign-in is off,
            so it carries its own spacing rather than the divider's. */}
        <GoogleSignIn />

        <Link
          to="/register"
          className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-ink"
        >
          ليس لديك حساب؟
          <span className="font-semibold text-brand-900">إنشاء حساب جديد</span>
          <ArrowLeft size={15} className="text-brand-600" />
        </Link>
      </AuthLayout>
    </>
  );
}
