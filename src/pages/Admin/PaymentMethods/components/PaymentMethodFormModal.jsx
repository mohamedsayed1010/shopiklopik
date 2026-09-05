import { useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AlertCircle, ChevronDown } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Switch from "../../../../components/ui/Switch";
import TextField, { TextAreaField } from "../../../../components/ui/TextField";
import Skeleton from "../../../../components/ui/Skeleton";
import {
  errorClass,
  inputClass,
  labelClass,
  selectClass,
} from "../../../../components/ui/formStyles";
import {
  useAdminPaymentMethod,
  useAdminPaymentMethodTypes,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
} from "../../../../hooks/admin/useAdminPaymentMethods";
import {
  PAYMENT_FIELD_GROUPS,
  fieldGroupsForType,
  methodToFormValues,
} from "../../../../utils/paymentMethodFields";

const REQUIRED = "هذا الحقل مطلوب";

const requiredForGroup = (group) =>
  Yup.string()
    .trim()
    .when("type", ([type], schema) =>
      fieldGroupsForType(type).includes(group)
        ? schema.required(REQUIRED)
        : schema
    );

const validationSchema = Yup.object({
  arabicName: Yup.string().trim().required("الاسم بالعربية مطلوب"),

  name: Yup.string().trim().required("الاسم بالإنجليزية مطلوب"),

  type: Yup.string().required("اختر نوع الطريقة"),

  phoneNumber: requiredForGroup(PAYMENT_FIELD_GROUPS.phone),

  instaPayIdentifier: requiredForGroup(PAYMENT_FIELD_GROUPS.instaPay),

  bankName: requiredForGroup(PAYMENT_FIELD_GROUPS.bank),

  accountHolderName: requiredForGroup(PAYMENT_FIELD_GROUPS.bank),

  accountNumber: requiredForGroup(PAYMENT_FIELD_GROUPS.bank),

  // Not required even for a bank: the live data has a bank row with no IBAN.
  iban: Yup.string().trim(),

  instructions: Yup.string().trim().max(1000, "الحد الأقصى 1000 حرف"),

  displayOrder: Yup.number()
    .typeError("أدخل رقمًا")
    .min(0, "لا يقل عن صفر")
    .required(REQUIRED),
});

const EMPTY = {
  name: "",
  arabicName: "",
  type: "",
  phoneNumber: "",
  instaPayIdentifier: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  iban: "",
  instructions: "",
  isActive: true,
  displayOrder: 0,
};

export default function PaymentMethodFormModal({ open, method, onClose }) {
  const isEdit = Boolean(method?.id);

  const { types, typesQuery } = useAdminPaymentMethodTypes({ enabled: open });

  /* Re-read the row when editing: the list entry may have been sitting in the
     cache, and the contract publishes this endpoint for exactly this. The row
     seeds it so the form paints at once. */
  const detailsQuery = useAdminPaymentMethod({
    id: method?.id,
    seed: method,
    enabled: open && isEdit,
  });

  const loaded = detailsQuery.data?.data ?? method ?? null;

  const createMutation = useCreatePaymentMethod({ onDone: onClose });

  const updateMutation = useUpdatePaymentMethod({ onDone: onClose });

  const active = isEdit ? updateMutation.mutation : createMutation.mutation;

  const formik = useFormik({
    initialValues: isEdit && loaded ? methodToFormValues(loaded) : EMPTY,
    validationSchema,
    enableReinitialize: false,
    onSubmit: (values) => {
      if (active.isPending) return;

      if (isEdit) updateMutation.submit({ id: method.id, values });
      else createMutation.submit(values);
    },
  });

  const formikRef = useRef(formik);

  useEffect(() => {
    formikRef.current = formik;
  });

  useEffect(() => {
    if (!open) return;

    formikRef.current.resetForm({
      values: isEdit && loaded ? methodToFormValues(loaded) : EMPTY,
    });
  }, [open, isEdit, loaded]);

  const groups = fieldGroupsForType(formik.values.type);

  const showPhone = groups.includes(PAYMENT_FIELD_GROUPS.phone);

  const showInstaPay = groups.includes(PAYMENT_FIELD_GROUPS.instaPay);

  const showBank = groups.includes(PAYMENT_FIELD_GROUPS.bank);

  const typeInvalid = Boolean(formik.touched.type && formik.errors.type);

  const orderInvalid = Boolean(
    formik.touched.displayOrder && formik.errors.displayOrder
  );

  return (
    <Modal
      open={open}
      onClose={active.isPending ? undefined : onClose}
      title={isEdit ? "تعديل طريقة الدفع" : "إضافة طريقة دفع"}
      description={isEdit ? loaded?.arabicName || loaded?.name : undefined}
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={active.isPending}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            fullWidth
            loading={active.isPending}
            onClick={formik.handleSubmit}
          >
            {isEdit ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </div>
      }
    >
      {isEdit && detailsQuery.isLoading && !loaded ? (
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              formik={formik}
              name="arabicName"
              label="الاسم بالعربية"
              placeholder="فودافون كاش"
            />

            <TextField
              formik={formik}
              name="name"
              label="الاسم بالإنجليزية"
              dir="ltr"
              placeholder="Vodafone Cash"
            />
          </div>

          {/* Type — options are the server's, ids are not contiguous. */}
          <div>
            <label htmlFor="type" className={labelClass}>
              نوع الطريقة
            </label>

            <div className="relative">
              <select
                id="type"
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={typesQuery.isLoading}
                aria-invalid={typeInvalid}
                className={selectClass({ invalid: typeInvalid })}
              >
                <option value="">
                  {typesQuery.isLoading ? "جارٍ التحميل…" : "اختر النوع"}
                </option>

                {types.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
              />
            </div>

            {typeInvalid && (
              <p role="alert" className={errorClass}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{formik.errors.type}</span>
              </p>
            )}

            {typesQuery.isError && (
              <p role="alert" className={errorClass}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>تعذّر تحميل الأنواع. أغلق النافذة وحاول مرة أخرى.</span>
              </p>
            )}
          </div>

          {showPhone && (
            <TextField
              formik={formik}
              name="phoneNumber"
              label="رقم المحفظة"
              dir="ltr"
              placeholder="01000000000"
            />
          )}

          {showInstaPay && (
            <TextField
              formik={formik}
              name="instaPayIdentifier"
              label="معرّف إنستا باي"
              dir="ltr"
              placeholder="user@instapay"
            />
          )}

          {showBank && (
            <div className="rounded-2xl border border-line bg-canvas p-4">
              <p className="mb-4 text-[13px] font-bold text-ink">
                بيانات الحساب البنكي
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField formik={formik} name="bankName" label="اسم البنك" />

                <TextField
                  formik={formik}
                  name="accountHolderName"
                  label="اسم صاحب الحساب"
                />

                <TextField
                  formik={formik}
                  name="accountNumber"
                  label="رقم الحساب"
                  dir="ltr"
                />

                <TextField
                  formik={formik}
                  name="iban"
                  label="IBAN (اختياري)"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          <TextAreaField
            formik={formik}
            name="instructions"
            label="تعليمات الدفع"
            rows={3}
            maxLength={1000}
            hint="تظهر للمستخدم أثناء إرسال الدفعة."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="displayOrder" className={labelClass}>
                ترتيب العرض
              </label>

              <input
                id="displayOrder"
                name="displayOrder"
                type="number"
                min="0"
                dir="ltr"
                value={formik.values.displayOrder}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={orderInvalid}
                className={`${inputClass({ invalid: orderInvalid })} tnum`}
              />

              {orderInvalid && (
                <p role="alert" className={errorClass}>
                  <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{formik.errors.displayOrder}</span>
                </p>
              )}
            </div>

            <div className="flex items-end">
              <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-canvas px-4 py-3">
                <span className="text-sm font-medium text-ink">
                  {formik.values.isActive ? "مفعّلة" : "معطّلة"}
                </span>

                <Switch
                  checked={Boolean(formik.values.isActive)}
                  onChange={(next) => formik.setFieldValue("isActive", next)}
                  label="تفعيل طريقة الدفع"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
