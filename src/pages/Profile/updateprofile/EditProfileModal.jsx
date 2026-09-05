import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import { AtSign, Check, ImagePlus, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

import updateProfileSchema from "./updateProfileSchema";
import useUpdateProfile from "./useUpdateProfile";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { TextField, SelectField } from "../../../components/ui/TextField";
import { labelClass, hintClass, inputClass } from "../../../components/ui/formStyles";
import ProfileAvatar from "../components/ProfileAvatar";
import { validateImageFile } from "../useProfileImage";
import useCenters from "./useCenters";
import { reportFormikApiError } from "../../../utils/reportApiError";

export default function EditProfileModal({ profile, onClose }) {
  const { updateProfileMutation } = useUpdateProfile();

  const [preview, setPreview] = useState(null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef(null);

  const { centers, isLoading: isCentersLoading } = useCenters(profile?.governorate);

  useEffect(() => {
    if (!preview) return undefined;

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  // Hold the success state on screen long enough to be read, then dismiss.
  useEffect(() => {
    if (!saved) return undefined;

    const timer = setTimeout(() => onClose?.(), 900);

    return () => clearTimeout(timer);
  }, [saved, onClose]);

  const formik = useFormik({
    enableReinitialize: true,

    initialValues: {
      firstName: profile?.firstName || "",
      secondName: profile?.secondName || "",
      username: profile?.username || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      center: profile?.center || "",
      profileImage: null,
    },

    validationSchema: updateProfileSchema,

    onSubmit: (values) => {
      updateProfileMutation.mutate(values, {
        onSuccess: () => setSaved(true),

        /* Placed here rather than in the hook so the findings can reach the
           inputs — the hook has no form to put them on. */
        onError: (error) =>
          reportFormikApiError(
            error,
            formik,
            "تعذّر حفظ التعديلات، حاول مرة أخرى"
          ),
      });
    },
  });

  const isPending = updateProfileMutation.isPending;

  const fullName = [formik.values.firstName, formik.values.secondName]
    .filter(Boolean)
    .join(" ");

  /* The centre the account already has must stay selectable even if the
     lookup is still loading or does not list it — otherwise opening the sheet
     and saving would silently move the user somewhere else. */
  const centerOptions = [
    ...new Set([profile?.center, ...centers].filter(Boolean)),
  ];

  return (
    <Modal
      open
      onClose={isPending || saved ? undefined : onClose}
      title="تعديل البيانات"
      description="حدّث بياناتك الشخصية وصورة حسابك."
      size="lg"
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
            form="edit-profile-form"
            fullWidth
            loading={isPending}
            disabled={saved}
          >
            {isPending ? "جارٍ الحفظ..." : saved ? "تم الحفظ" : "حفظ التعديلات"}
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

              <p className="text-[15px] font-bold text-ink">تم حفظ التعديلات</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          id="edit-profile-form"
          onSubmit={formik.handleSubmit}
          className="space-y-6"
        >
          {/* Photo */}
          <div>
            <label className={labelClass}>الصورة الشخصية</label>

            <div className="flex items-center gap-4 rounded-2xl border border-line bg-canvas p-4">
              <ProfileAvatar
                src={preview ?? profile?.profileImageUrl}
                name={fullName || profile?.username}
                size={64}
              />

              <div className="min-w-0 flex-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={15} className="text-brand-500" />
                  {formik.values.profileImage ? "تغيير الصورة" : "اختر صورة"}
                </Button>

                <p className={hintClass}>
                  {formik.values.profileImage?.name ?? "JPG أو PNG — حتى 5 ميجابايت"}
                </p>
              </div>

              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] || null;

                  if (!file) return;

                  const problem = validateImageFile(file);

                  if (problem) {
                    toast.error(problem);

                    event.currentTarget.value = "";

                    return;
                  }

                  formik.setFieldValue("profileImage", file);

                  setPreview(URL.createObjectURL(file));
                }}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              formik={formik}
              name="firstName"
              label="الاسم الأول"
              icon={User}
            />

            <TextField
              formik={formik}
              name="secondName"
              label="الاسم الثاني"
              icon={User}
            />

            <TextField
              formik={formik}
              name="username"
              label="اسم المستخدم"
              dir="ltr"
              icon={AtSign}
            />

            <TextField
              formik={formik}
              name="email"
              type="email"
              label="البريد الإلكتروني"
              dir="ltr"
              icon={Mail}
            />

            <TextField
              formik={formik}
              name="phone"
              type="tel"
              label="رقم الهاتف"
              dir="ltr"
              icon={Phone}
            />

            <SelectField
              formik={formik}
              name="center"
              label="المركز"
              placeholder={isCentersLoading ? "جارٍ التحميل..." : "اختر المركز"}
              options={centerOptions}
              icon={MapPin}
            />

            {/* Read-only: not part of the update contract. */}
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
        </form>
      </div>
    </Modal>
  );
}
