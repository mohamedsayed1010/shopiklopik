import Seo from "../Seo";
import { Lock, ShieldCheck } from "lucide-react";

import useResetPassword from "./useResetPassword";
import AuthLayout from "../ui/AuthLayout";
import Button from "../ui/Button";
import { TextField } from "../ui/TextField";
import PasswordChecklist from "../ui/PasswordChecklist";

export default function ResetPassword() {
  const { formik, isPending } = useResetPassword();

  return (
    <>
      <Seo title="إعادة تعيين كلمة المرور" />

      <AuthLayout
        title="إعادة تعيين كلمة المرور"
        subtitle="اختر كلمة مرور جديدة قوية لحماية حسابك."
      >
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <div>
            <TextField
              formik={formik}
              name="newPassword"
              type="password"
              label="كلمة المرور الجديدة"
              placeholder="أدخل كلمة المرور الجديدة"
              autoComplete="new-password"
              icon={Lock}
            />

            <PasswordChecklist
              value={formik.values.newPassword}
              className="mt-3"
            />
          </div>

          <TextField
            formik={formik}
            name="confirmPassword"
            type="password"
            label="تأكيد كلمة المرور"
            placeholder="أعد إدخال كلمة المرور"
            autoComplete="new-password"
            icon={Lock}
          />

          <div className="pt-2">
            <Button type="submit" size="lg" fullWidth loading={isPending}>
              {!isPending && <ShieldCheck size={18} />}
              {isPending ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
            </Button>
          </div>
        </form>
      </AuthLayout>
    </>
  );
}
