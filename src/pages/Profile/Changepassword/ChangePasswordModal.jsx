import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import changePasswordSchema from "./changePasswordSchema";
import useChangePassword from "./useChangePassword";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { TextField } from "../../../components/ui/TextField";
import PasswordChecklist from "../../../components/ui/PasswordChecklist";
import { reportFormikApiError } from "../../../utils/reportApiError";

export default function ChangePasswordModal({ onClose }) {
  const { changePasswordMutation } = useChangePassword();

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;

    const timer = setTimeout(() => onClose?.(), 900);

    return () => clearTimeout(timer);
  }, [saved, onClose]);

  const formik = useFormik({
    initialValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },

    validationSchema: changePasswordSchema,

    onSubmit: (values, helpers) => {
      changePasswordMutation.mutate(values, {
        onSuccess: () => {
          helpers.resetForm();

          setSaved(true);
        },

        onError: (error) =>
          reportFormikApiError(
            error,
            formik,
            "تعذّر تغيير كلمة المرور، تحقق من بياناتك"
          ),
      });
    },
  });

  const isPending = changePasswordMutation.isPending;

  return (
    <Modal
      open
      onClose={isPending || saved ? undefined : onClose}
      title="تغيير كلمة المرور"
      description="اختر كلمة مرور جديدة قوية لحماية حسابك."
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isPending || saved}
          >
            إلغاء
          </Button>

          <Button
            type="submit"
            form="change-password-form"
            fullWidth
            loading={isPending}
            disabled={saved}
          >
            {isPending
              ? "جارٍ الحفظ..."
              : saved
                ? "تم التغيير"
                : "تغيير كلمة المرور"}
          </Button>
        </div>
      }
    >
      <div className="relative">
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-surface/85 backdrop-blur-sm"
            >
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg"
              >
                <Check size={30} strokeWidth={3} />
              </motion.span>

              <p className="text-[15px] font-bold text-ink">
                تم تغيير كلمة المرور
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          id="change-password-form"
          onSubmit={formik.handleSubmit}
          className="space-y-5"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-4">
            <ShieldCheck
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-brand-500"
            />

            <p className="text-[12.5px] leading-6 text-ink-soft">
              بعد التغيير، استخدم كلمة المرور الجديدة في أي تسجيل دخول قادم.
            </p>
          </div>

          <TextField
            formik={formik}
            name="oldPassword"
            type="password"
            label="كلمة المرور الحالية"
            autoComplete="current-password"
            icon={Lock}
          />

          <div>
            <TextField
              formik={formik}
              name="newPassword"
              type="password"
              label="كلمة المرور الجديدة"
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
            autoComplete="new-password"
            icon={Lock}
          />
        </form>
      </div>
    </Modal>
  );
}
