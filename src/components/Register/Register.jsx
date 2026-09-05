import { Link } from "react-router-dom";
import Seo from "../Seo";
import { User, Mail, Phone, Lock, MapPin, ArrowLeft } from "lucide-react";

import useRegister from "./useRegister";
import AuthLayout from "../ui/AuthLayout";
import Button from "../ui/Button";
import { TextField, SelectField } from "../ui/TextField";
import PasswordChecklist from "../ui/PasswordChecklist";
import ReferralInvite from "./ReferralInvite";
import { labelClass, inputClass } from "../ui/formStyles";

const CENTERS = [
  "الفيوم",
  "سنورس",
  "اطسا",
  "طامية",
  "ابشواي",
  "يوسف الصديق",
  "الفيوم الجديدة"

];

/** Nine fields is a lot; grouping turns it into three short asks. */
function FormSection({ title, children }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-wide text-muted">
        <span aria-hidden="true" className="h-3.5 w-1 rounded-full bg-gold-300" />
        {title}
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function Register() {
  const { formik, isPending } = useRegister();

  const password = formik.values.password;

  return (
    <>
      <Seo
        title="إنشاء حساب جديد"
        description="أنشئ حسابًا مجانيًا لنشر إعلاناتك وحفظ ما يهمك والتواصل مع البائعين داخل محافظة الفيوم."
      />

      <AuthLayout
        wide
        title="إنشاء حساب جديد"
        subtitle="أنشئ حسابك مجاناً وابدأ في نشر إعلاناتك خلال دقيقة."
      >
        <form onSubmit={formik.handleSubmit} className="space-y-8">
          <FormSection title="البيانات الشخصية">
            <TextField
              formik={formik}
              name="firstName"
              label="الاسم الأول"
              placeholder="محمد"
              autoComplete="given-name"
              icon={User}
            />

            <TextField
              formik={formik}
              name="secondName"
              label="الاسم الثاني"
              placeholder="أحمد"
              autoComplete="family-name"
              icon={User}
            />

            <TextField
              formik={formik}
              name="phone"
              type="tel"
              label="رقم الهاتف"
              placeholder="01xxxxxxxxx"
              autoComplete="tel"
              dir="ltr"
              icon={Phone}
              className="sm:col-span-2"
            />
          </FormSection>

          <FormSection title="بيانات الحساب">
            <TextField
              formik={formik}
              name="username"
              label="اسم المستخدم"
              placeholder="اسم المستخدم"
              autoComplete="username"
              icon={User}
            />

            <TextField
              formik={formik}
              name="email"
              type="email"
              label="البريد الإلكتروني"
              placeholder="name@example.com"
              autoComplete="email"
              dir="ltr"
              icon={Mail}
            />

            {/* Fixed to Fayoum — shown, not hidden, so the scope is obvious */}
            <div>
              <label className={labelClass}>المحافظة</label>

              <div className="relative">
                <MapPin
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
                />

                <input
                  type="text"
                  value={formik.values.governorate}
                  readOnly
                  aria-readonly="true"
                  tabIndex={-1}
                  className={`${inputClass()} bg-canvas ps-11 text-muted`}
                />
              </div>
            </div>

            <SelectField
              formik={formik}
              name="center"
              label="المركز"
              placeholder="اختر المركز"
              options={CENTERS}
              icon={MapPin}
            />
          </FormSection>

          <FormSection title="الدعوة">
            <ReferralInvite formik={formik} />
          </FormSection>

          <FormSection title="كلمة المرور">
            <TextField
              formik={formik}
              name="password"
              type="password"
              label="كلمة المرور"
              placeholder="أدخل كلمة مرور قوية"
              autoComplete="new-password"
              icon={Lock}
            />

            <TextField
              formik={formik}
              name="confirmPassword"
              type="password"
              label="تأكيد كلمة المرور"
              placeholder="أعد إدخال كلمة المرور"
              autoComplete="new-password"
              icon={Lock}
            />

            <PasswordChecklist value={password} className="sm:col-span-2" />
          </FormSection>

          <div>
            <Button type="submit" size="lg" fullWidth loading={isPending}>
              {isPending ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
            </Button>

            <p className="mt-3 text-center text-xs leading-6 text-muted">
              بإنشاء الحساب أنت توافق على استخدام المنصة بشكل مسؤول.
            </p>
          </div>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs font-medium text-muted">أو</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-ink"
        >
          لديك حساب بالفعل؟
          <span className="font-semibold text-brand-900">تسجيل الدخول</span>
          <ArrowLeft size={15} className="text-brand-600" />
        </Link>
      </AuthLayout>
    </>
  );
}
