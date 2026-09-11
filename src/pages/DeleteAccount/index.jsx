import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { Info, LifeBuoy, ListOrdered, LogIn, ShieldCheck } from "lucide-react";

import Seo from "../../components/Seo";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { AuthContext } from "../../context/AuthContext";

import DeleteAccountForm from "./DeleteAccountForm";

const DESCRIPTION =
  "كيف تحذف حسابك في شوبيك لوبيك، وما الذي يحدث لحسابك وإعلاناتك بعد الحذف.";

const STEPS = [
  "سجّل الدخول إلى حسابك في شوبيك لوبيك من الموقع أو من التطبيق.",
  "افتح هذه الصفحة، أو اذهب إلى «الملف الشخصي» ثم «أمان الحساب» ثم «حذف الحساب».",
  "أكّد رغبتك في حذف الحساب، وأدخل كلمة المرور الحالية. يمكنك كتابة سبب الحذف إن أردت.",
  "اضغط «حذف الحساب» ثم أكّد الخطوة الأخيرة.",
];

const CONSEQUENCES = [
  "يتم تعطيل حسابك، ولن تتمكن من استخدامه بعد ذلك.",
  "تُخفى جميع إعلاناتك من المنصة ولا تظهر للزوار.",
  "تُنهى جلستك الحالية ويتم تسجيل خروجك فورًا بعد نجاح الحذف.",
  "لا يمكن تنفيذ الحذف إلا بعد تسجيل الدخول وإدخال كلمة المرور، حتى لا يستطيع أحد حذف حساب لا يملكه.",
];

function InfoCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-xs sm:p-7">
      <h2 className="flex items-center gap-2.5 text-[17px] font-bold leading-7 text-ink">
        <Icon size={19} aria-hidden="true" className="shrink-0 text-brand-500" />
        {title}
      </h2>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function InlineLink({ to, children }) {
  return (
    <Link to={to} className="font-semibold text-brand-600 hover:underline">
      {children}
    </Link>
  );
}

/** What a signed-out visitor sees where the form would be. */
function SignInPrompt() {
  const location = useLocation();

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 text-center shadow-xs sm:p-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-[17px] font-bold text-ink">
        سجّل الدخول لحذف حسابك
      </h2>

      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-7 text-muted">
        لحماية حسابك، لا يمكن تنفيذ الحذف إلا من داخل الحساب نفسه بعد تسجيل
        الدخول. ستعود إلى هذه الصفحة تلقائيًا بعد تسجيل الدخول.
      </p>

      {/* The address travels with the link, the same way `ProtectedRoute`
          sends it, so signing in lands back on this page. */}
      <Button
        as={Link}
        to="/login"
        state={{ from: location }}
        size="lg"
        className="mt-6"
      >
        <LogIn size={18} />
        تسجيل الدخول للمتابعة
      </Button>
    </div>
  );
}

/**
 * `/delete-account` — public by design.
 *
 * This is the address the Google Play listing gives as the account-deletion
 * URL, so it must open for anyone, signed in or not: it explains the process
 * and its consequences. Reading it is public; acting on it is not. The form
 * that actually sends `DELETE /api/account` renders only with a session, and a
 * signed-out visitor gets a sign-in prompt that returns them here.
 */
export default function DeleteAccountPage() {
  const { token } = useContext(AuthContext);

  return (
    <>
      <Seo title="حذف الحساب" description={DESCRIPTION} />

      <div className="mx-auto max-w-[820px] px-4 py-6 pb-20 sm:px-6 lg:py-10">
        <PageHeader eyebrow="الحساب" title="حذف الحساب" subtitle={DESCRIPTION} />

        <div className="mt-7 space-y-6">
          <InfoCard icon={ListOrdered} title="كيف تحذف حسابك">
            <ol className="space-y-3">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                    {index + 1}
                  </span>

                  <span className="pt-0.5 text-[14.5px] leading-7 text-ink-soft">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </InfoCard>

          <InfoCard icon={Info} title="ماذا يحدث بعد حذف الحساب">
            <ul className="space-y-2.5">
              {CONSEQUENCES.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 text-[14.5px] leading-7 text-ink-soft"
                >
                  <span
                    aria-hidden="true"
                    className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </InfoCard>

          <div id="delete-account-form">
            {token ? <DeleteAccountForm /> : <SignInPrompt />}
          </div>

          <InfoCard icon={LifeBuoy} title="بياناتك والمساعدة">
            <div className="space-y-3 text-[14.5px] leading-7 text-ink-soft">
              <p>
                لطلب حذف بيانات إضافية مرتبطة بحسابك، أو للاستفسار عن البيانات
                التي قد يُحتفظ بها بعد تعطيل الحساب، يمكنك{" "}
                <InlineLink to="/contact">التواصل معنا</InlineLink>، ومراجعة{" "}
                <InlineLink to="/privacy">سياسة الخصوصية</InlineLink>.
              </p>

              <p>
                لا تستطيع تسجيل الدخول؟ استعد كلمة المرور من{" "}
                <InlineLink to="/forgot-password">نسيت كلمة المرور</InlineLink>{" "}
                ثم تابع الخطوات أعلاه، أو{" "}
                <InlineLink to="/contact">تواصل معنا</InlineLink> وسنساعدك.
              </p>
            </div>
          </InfoCard>
        </div>
      </div>
    </>
  );
}
