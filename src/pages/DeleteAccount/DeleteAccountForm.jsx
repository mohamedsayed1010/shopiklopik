import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import { AlertCircle, AlertTriangle, Check, Lock, Trash2 } from "lucide-react";

import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { TextField, TextAreaField } from "../../components/ui/TextField";
import { errorClass } from "../../components/ui/formStyles";
import { AuthContext } from "../../context/AuthContext";
import useRequireAuth from "../../hooks/useRequireAuth";
import { apiErrorText } from "../../utils/apiErrors";
import { reportFormikApiError } from "../../utils/reportApiError";

import deleteAccountSchema, { REASON_MAX_LENGTH } from "./deleteAccountSchema";
import useDeleteAccount from "./useDeleteAccount";

const SERVER_FAULT =
  "تعذّر حذف الحساب الآن بسبب خطأ غير متوقع. حاول مرة أخرى بعد قليل.";

const RATE_LIMITED =
  "محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.";

/** Spoken only when the server's answer carries no message of its own. */
const STATUS_FALLBACKS = {
  400: "تعذّر تنفيذ الطلب، راجع البيانات وحاول مرة أخرى.",
  401: "تعذّر التحقق من هويتك. تأكد من كلمة المرور، أو سجّل دخولك من جديد.",
  403: "لا يمكن حذف هذا الحساب من هنا. تواصل مع الدعم للمساعدة.",
  409: "لا يمكن حذف الحساب في حالته الحالية.",
  422: "تعذّر التحقق من البيانات المُدخلة. تأكد من كلمة المرور وحاول مرة أخرى.",
};

const GENERIC_FAILURE = "تعذّر حذف الحساب، حاول مرة أخرى.";

/**
 * A server fault or a dropped connection is described in our words — whatever
 * the body says there is developer text. Everything else is the backend's own
 * message, which is written for the reader, placed on a field when it names one.
 */
function reportDeletionError(error, formik) {
  const status = error?.response?.status;

  if ((error?.isAxiosError && !error.response) || status >= 500) {
    toast.error(SERVER_FAULT);

    return;
  }

  if (status === 429) {
    toast.error(apiErrorText(error, RATE_LIMITED));

    return;
  }

  /* This endpoint answers a wrong password with 401 (see `axiosInstance`), so
     the message belongs on the password field, where it will be retyped. */
  if (status === 401) {
    formik.setFieldTouched("password", true, false);

    formik.setFieldError("password", apiErrorText(error, STATUS_FALLBACKS[401]));

    return;
  }

  reportFormikApiError(error, formik, STATUS_FALLBACKS[status] ?? GENERIC_FAILURE);
}

/**
 * The authenticated half of `/delete-account`. Rendered only with a session;
 * the public page shows a sign-in prompt in its place otherwise.
 *
 * Three deliberate steps stand between the reader and the request: ticking the
 * confirmation, entering the password, and answering the final dialog. Passing
 * validation only opens that dialog — nothing is sent until it is confirmed.
 */
export default function DeleteAccountForm() {
  const { user } = useContext(AuthContext);

  const { requireAuth } = useRequireAuth();

  const deleteAccountMutation = useDeleteAccount();

  const [confirming, setConfirming] = useState(false);

  const formik = useFormik({
    initialValues: {
      confirm: false,
      password: "",
      reason: "",
    },

    validationSchema: deleteAccountSchema,

    onSubmit: () => setConfirming(true),
  });

  const isPending = deleteAccountMutation.isPending;

  const confirmChecked = formik.values.confirm === true;

  const confirmInvalid = Boolean(formik.touched.confirm && formik.errors.confirm);

  const fullName = [user?.firstName, user?.secondName].filter(Boolean).join(" ");

  const handleConfirm = () => {
    if (!requireAuth("سجّل دخولك لحذف حسابك")) {
      setConfirming(false);

      return;
    }

    const { confirm, password, reason } = formik.values;

    deleteAccountMutation.mutate(
      { confirm, password, reason },
      {
        onError: (error) => {
          setConfirming(false);

          reportDeletionError(error, formik);
        },
      }
    );
  };

  return (
    <>
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        className="rounded-3xl border border-red-200 bg-surface p-5 shadow-xs sm:p-7"
      >
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle
            size={20}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div className="min-w-0">
            <p className="text-[15px] font-bold text-red-700">
              تنبيه: هذا إجراء خطير
            </p>

            <p className="mt-1 text-[13px] leading-6 text-red-700/90">
              بعد تأكيد الحذف سيتم تعطيل حسابك وإخفاء إعلاناتك، وسيتم تسجيل
              خروجك فورًا.
            </p>
          </div>
        </div>

        {fullName && (
          <p className="mt-5 text-[13.5px] leading-7 text-ink-soft">
            أنت مسجّل الدخول باسم{" "}
            <span className="font-semibold text-ink">{fullName}</span>
            {user?.email && (
              <>
                {" "}
                (<span dir="ltr">{user.email}</span>)
              </>
            )}
            . هذا هو الحساب الذي سيتم حذفه.
          </p>
        )}

        <div className="mt-5 space-y-5">
          <div>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-red-500/15 ${
                confirmInvalid
                  ? "border-red-400 bg-red-50/40"
                  : "border-line-strong bg-surface hover:border-red-300"
              }`}
            >
              <input
                type="checkbox"
                name="confirm"
                className="sr-only"
                checked={confirmChecked}
                disabled={isPending}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={confirmInvalid}
                aria-describedby={confirmInvalid ? "confirm-error" : undefined}
              />

              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  confirmChecked
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-line-strong"
                }`}
              >
                {confirmChecked && <Check size={13} strokeWidth={3} />}
              </span>

              <span className="text-sm font-medium leading-6 text-ink">
                أفهم أن حسابي سيتم تعطيله وأن إعلاناتي ستُخفى، وأرغب في حذف
                حسابي.
              </span>
            </label>

            {confirmInvalid && (
              <p id="confirm-error" role="alert" className={errorClass}>
                <AlertCircle
                  size={13}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{formik.errors.confirm}</span>
              </p>
            )}
          </div>

          <TextField
            formik={formik}
            name="password"
            type="password"
            label="كلمة المرور الحالية *"
            autoComplete="current-password"
            icon={Lock}
            labelAction={
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            }
          />

          <TextAreaField
            formik={formik}
            name="reason"
            label="سبب الحذف (اختياري)"
            rows={3}
            maxLength={REASON_MAX_LENGTH}
            placeholder="ساعدنا على التحسّن: لماذا تريد حذف حسابك؟"
            hint="اختياري، ويساعدنا على تحسين المنصة."
          />
        </div>

        <Button
          type="submit"
          variant="danger"
          size="lg"
          fullWidth
          disabled={isPending}
          className="mt-7"
        >
          <Trash2 size={18} />
          حذف الحساب
        </Button>
      </form>

      <ConfirmDialog
        open={confirming}
        title="هل أنت متأكد من حذف حسابك؟"
        description="سيتم تعطيل حسابك وإخفاء جميع إعلاناتك، وسيتم تسجيل خروجك فورًا. تأكد أنك تريد المتابعة."
        confirmLabel="نعم، احذف حسابي"
        cancelLabel="تراجع"
        loading={isPending}
        onConfirm={handleConfirm}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
