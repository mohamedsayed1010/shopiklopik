import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import {
  ArrowLeft,
  AtSign,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  User,
} from "lucide-react";

import Seo from "../../../components/Seo";
import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import { PageSpinner } from "../../../components/ui/Spinner";
import { TextField, SelectField } from "../../../components/ui/TextField";
import {
  labelClass,
  hintClass,
  inputClass,
} from "../../../components/ui/formStyles";

import useCenters from "./useCenters";
import useUpdateProfile from "./useUpdateProfile";
import updateProfileSchema from "./updateProfileSchema";

import { AuthContext } from "../../../context/AuthContext";
import useProfileCompletion from "../../../hooks/useProfileCompletion";
import {
  missingCompletableFields,
  isProfileComplete,
} from "../../../utils/profileCompletion";
import { redirectTarget, AUTH_PATHS } from "../../../utils/redirectTarget";
import { reportFormikApiError } from "../../../utils/reportApiError";
import { PROFILE_COMPLETION_PATH } from "../../../components/ProfileCompletionGuard/ProfileCompletionGuard";

/**
 * The profile form as a page of its own.
 *
 * Not a second profile system: the same fields the profile sheet edits, through
 * the same `updateProfileSchema`, the same `useUpdateProfile` mutation, the same
 * `useCenters` lookup and the same cache. What a dialog cannot be is the
 * destination of a redirect — and this is the one address an account short of
 * its required data is allowed to open.
 *
 * With nothing missing it is an ordinary edit page; with something missing it
 * says so, names it, and keeps the reader here until the server itself says
 * otherwise.
 */
export default function EditProfilePage() {
  /* One observer for both questions. The completion hook already reads the
     profile under the shared key — a second `useProfile` here would be the same
     request with its own retry policy, so this page could still be spinning
     while the guard had long since decided. */
  const { profile, status, missing, isLoading, isError, refetch } =
    useProfileCompletion();

  const { logout, patchUser } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const { updateProfileMutation } = useUpdateProfile();

  const { centers, isLoading: isCentersLoading } = useCenters(
    profile?.governorate
  );

  /* What the server still says is missing after a save. The reader's own
     answers are not evidence — only the record that came back is. */
  const [stillMissing, setStillMissing] = useState(null);

  const [saved, setSaved] = useState(false);

  const blocked = status === "incomplete" || status === "error";

  /* Where the guard interrupted them. Never back to this page, and never onto a
     sign-in screen — both are loops rather than destinations. */
  const from = redirectTarget(location.state?.from, {
    avoid: [PROFILE_COMPLETION_PATH, ...AUTH_PATHS],
  });

  const formik = useFormik({
    enableReinitialize: true,

    initialValues: {
      firstName: profile?.firstName || "",
      secondName: profile?.secondName || "",
      username: profile?.username || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      center: profile?.center || "",
    },

    // The rules the profile sheet already validates against — one schema.
    validationSchema: updateProfileSchema,

    onSubmit: (values) => {
      updateProfileMutation.mutate(values, {
        onSuccess: (response) => {
          const record = response?.data ?? null;

          /* The session's stored account is what the guard judges by on the
             next paint; leaving it behind would have it judge by the record
             this call just replaced. `useUpdateProfile` has already merged the
             same record into the profile cache and invalidated it. */
          patchUser(record);

          setSaved(true);

          /* Completeness is re-decided from what the backend returned, never
             from what was typed. A response carrying no record decides
             nothing — the mutation hook is already refetching the profile, and
             the guard follows that. */
          if (record && isProfileComplete(record)) {
            setStillMissing([]);

            navigate(from, { replace: true });

            return;
          }

          setStillMissing(record ? missingCompletableFields(record) : null);
        },

        /* Placed here rather than in the hook, as the profile sheet does, so
           the server's findings can reach the inputs they belong to. */
        onError: (error) =>
          reportFormikApiError(
            error,
            formik,
            "تعذّر حفظ البيانات، حاول مرة أخرى"
          ),
      });
    },
  });

  const isPending = updateProfileMutation.isPending;

  /* The centre the account already has stays selectable even while the lookup
     is loading, so opening the form and saving cannot quietly move it. */
  const centerOptions = [
    ...new Set([profile?.center, ...centers].filter(Boolean)),
  ];

  const outstanding = stillMissing ?? (blocked ? missing : []);

  if (isLoading) return <PageSpinner label="جارٍ تحميل بياناتك..." />;

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <ErrorState
          title="تعذّر تحميل بياناتك"
          description="لم نتمكّن من قراءة بيانات حسابك، ولا يمكن متابعة استخدام الموقع قبل التأكد من اكتمالها. تحقّق من اتصالك وحاول مرة أخرى."
          onRetry={refetch}
        />

        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={logout}>
            <LogOut size={16} />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* `/profile/edit` is already noindex,nofollow by path policy. */}
      <Seo title={blocked ? "أكمل بياناتك" : "تعديل البيانات"} />

      <div className="mx-auto max-w-2xl px-4 py-8 pb-20 sm:px-6 lg:py-12">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {blocked ? "أكمل بياناتك" : "تعديل البيانات"}
          </h1>

          <p className="mt-2.5 text-sm leading-7 text-muted sm:text-[15px]">
            {blocked
              ? "من فضلك أكمل البيانات المطلوبة قبل متابعة استخدام الموقع."
              : "حدّث بياناتك الشخصية. لتغيير صورة حسابك افتح ملفك الشخصي."}
          </p>
        </header>

        {blocked && outstanding.length > 0 && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-gold-300 bg-gold-50 px-4 py-3.5 text-[13px] leading-6 text-brand-900"
          >
            <ShieldAlert
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-gold-600"
            />

            <p className="flex-1">
              البيانات المطلوبة الناقصة:{" "}
              <span className="font-semibold">
                {outstanding.map((field) => field.label).join("، ")}
              </span>
            </p>
          </div>
        )}

        {saved && !blocked && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5 text-[13px] text-green-800">
            <CheckCircle2 size={18} aria-hidden="true" className="shrink-0" />
            تم حفظ بياناتك.
          </div>
        )}

        <form
          onSubmit={formik.handleSubmit}
          className="mt-7 rounded-3xl border border-line bg-surface p-5 sm:p-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              formik={formik}
              name="firstName"
              label="الاسم الأول *"
              icon={User}
              autoComplete="given-name"
            />

            <TextField
              formik={formik}
              name="secondName"
              label="الاسم الثاني *"
              icon={User}
              autoComplete="family-name"
            />

            <TextField
              formik={formik}
              name="username"
              label="اسم المستخدم *"
              dir="ltr"
              icon={AtSign}
              autoComplete="username"
            />

            <TextField
              formik={formik}
              name="email"
              type="email"
              label="البريد الإلكتروني *"
              dir="ltr"
              icon={Mail}
              autoComplete="email"
            />

            <TextField
              formik={formik}
              name="phone"
              type="tel"
              label="رقم الهاتف *"
              placeholder="01xxxxxxxxx"
              dir="ltr"
              icon={Phone}
              autoComplete="tel"
            />

            <SelectField
              formik={formik}
              name="center"
              label="المركز *"
              placeholder={isCentersLoading ? "جارٍ التحميل..." : "اختر المركز"}
              options={centerOptions}
              icon={MapPin}
            />

            {/* Read-only for the same reason it is in the profile sheet:
                `PUT /api/profile` publishes no governorate part. */}
            <div className="sm:col-span-2">
              <label htmlFor="governorate" className={labelClass}>
                المحافظة
              </label>

              <div className="relative">
                <MapPin
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
                />

                <input
                  id="governorate"
                  readOnly
                  disabled
                  value={profile?.governorate || "غير محدّد"}
                  className={`${inputClass()} ps-11 pe-11`}
                />

                <Lock
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
                />
              </div>

              <p className={hintClass}>
                لا يمكن تغيير المحافظة من هنا. تواصل مع الدعم إذا كنت بحاجة إلى
                تعديلها.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isPending}
              disabled={isPending}
            >
              {isPending
                ? "جارٍ الحفظ..."
                : blocked
                  ? "حفظ ومتابعة"
                  : "حفظ التعديلات"}
            </Button>

            {/* Signing out has to stay reachable from behind the wall. */}
            {blocked ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                fullWidth
                disabled={isPending}
                onClick={logout}
              >
                <LogOut size={16} />
                تسجيل الخروج
              </Button>
            ) : (
              <Button
                as={Link}
                to="/profile"
                size="lg"
                variant="outline"
                fullWidth
              >
                <ArrowLeft size={16} />
                العودة إلى الملف الشخصي
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
