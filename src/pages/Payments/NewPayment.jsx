import { useEffect, useMemo, useRef, useState } from "react";
import Seo from "../../components/Seo";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AlertCircle, ImageUp, RotateCcw, Send, Wallet } from "lucide-react";

import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import { TextAreaField } from "../../components/ui/TextField";
import PaymentMethodInfo from "../../components/payments/PaymentMethodInfo";
import { usePaymentMethods, useCreatePayment } from "../../hooks/usePayments";
import { inputClass, labelClass, errorClass } from "../../components/ui/formStyles";

const MAX_SCREENSHOT_MB = 12;

const MB = 1024 * 1024;

const validationSchema = Yup.object({
  paymentMethodId: Yup.string().required("اختر طريقة الدفع"),

  amount: Yup.number()
    .typeError("أدخل مبلغًا صحيحًا")
    .positive("يجب أن يكون المبلغ أكبر من صفر")
    .required("أدخل المبلغ"),

  notes: Yup.string().max(1000, "الحد الأقصى 1000 حرف"),
});

function MethodsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-[86px] rounded-2xl" />
      ))}
    </div>
  );
}

export default function NewPaymentPage() {
  const navigate = useNavigate();

  const { methodsQuery, methods } = usePaymentMethods();

  const inputRef = useRef(null);

  const [screenshot, setScreenshot] = useState(null);

  const [previewUrl, setPreviewUrl] = useState(null);

  const [fileError, setFileError] = useState(null);

  const { createMutation, submit, progress } = useCreatePayment({
    onDone: (created) => {
      /* Land on the payment that was just created — the 201 seeded its detail
         cache, so that screen paints without another request. */
      if (created?.id) navigate(`/payments/${created.id}`, { replace: true });
      else navigate("/payments", { replace: true });
    },
  });

  /* Revoking is tied to the URL rather than to the picker, so an unmount
     mid-selection cannot leak the blob. */
  useEffect(() => {
    if (!previewUrl) return undefined;

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const formik = useFormik({
    initialValues: { paymentMethodId: "", amount: "", notes: "" },
    validationSchema,
    onSubmit: (values) => {
      if (!screenshot) {
        setFileError("ارفع صورة إيصال التحويل");

        return;
      }

      if (createMutation.isPending) return;

      submit({
        paymentMethodId: Number(values.paymentMethodId),
        amount: Number(values.amount),
        screenshot,
        notes: values.notes,
      });
    },
  });

  const selected = useMemo(
    () =>
      methods.find(
        (method) => String(method.id) === String(formik.values.paymentMethodId)
      ) ?? null,
    [methods, formik.values.paymentMethodId]
  );

  const clearFile = () => {
    setScreenshot(null);

    setPreviewUrl(null);

    setFileError(null);

    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePick = (event) => {
    const picked = event.target.files?.[0];

    if (!picked) return;

    if (!picked.type.startsWith("image/")) {
      setFileError("الملف يجب أن يكون صورة");

      clearFile();

      return;
    }

    if (picked.size > MAX_SCREENSHOT_MB * MB) {
      setFileError(`الحجم الأقصى ${MAX_SCREENSHOT_MB} ميجابايت`);

      clearFile();

      return;
    }

    setFileError(null);

    setScreenshot(picked);

    setPreviewUrl(URL.createObjectURL(picked));
  };

  const amountInvalid = Boolean(formik.touched.amount && formik.errors.amount);

  return (
    <>
      <Seo title="إرسال دفعة" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[720px] px-4 py-6 pb-24 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="المدفوعات"
          title="إرسال دفعة"
          subtitle="اختر طريقة الدفع، حوّل المبلغ، ثم ارفع صورة الإيصال."
        />

        {methodsQuery.isLoading ? (
          <div className="mt-7">
            <MethodsSkeleton />
          </div>
        ) : methodsQuery.isError ? (
          <ErrorState
            className="mt-7"
            title="تعذّر تحميل طرق الدفع"
            description="حدث خطأ أثناء جلب طرق الدفع المتاحة. حاول مرة أخرى."
            onRetry={methodsQuery.refetch}
          />
        ) : methods.length === 0 ? (
          <EmptyState
            className="mt-7"
            icon={Wallet}
            title="لا توجد طرق دفع متاحة"
            description="لم تُفعّل إدارة المنصة أي طريقة دفع حتى الآن."
          />
        ) : (
          <form onSubmit={formik.handleSubmit} noValidate className="mt-7 space-y-6">
            {/* Method */}
            <section>
              <h2 className="mb-3 text-[15px] font-bold text-ink">طريقة الدفع</h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {methods.map((method) => {
                  const active =
                    String(method.id) === String(formik.values.paymentMethodId);

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() =>
                        formik.setFieldValue("paymentMethodId", String(method.id))
                      }
                      className={`cursor-pointer rounded-2xl border p-4 text-start transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 ${
                        active
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                          : "border-line bg-surface hover:border-brand-200"
                      }`}
                    >
                      <span className="block text-[14.5px] font-bold text-ink">
                        {method.arabicName || method.name}
                      </span>

                      {method.typeName && (
                        <span className="mt-1 block text-[12px] text-muted">
                          {method.typeName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {formik.touched.paymentMethodId && formik.errors.paymentMethodId && (
                <p role="alert" className={errorClass}>
                  <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{formik.errors.paymentMethodId}</span>
                </p>
              )}

              {selected && (
                <div className="mt-4">
                  <p className="mb-2 text-[13px] font-semibold text-ink-soft">
                    حوّل المبلغ إلى:
                  </p>

                  <PaymentMethodInfo method={selected} />
                </div>
              )}
            </section>

            {/* Amount */}
            <section>
              <label htmlFor="amount" className={labelClass}>
                المبلغ
              </label>

              <input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                dir="ltr"
                placeholder="0"
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={amountInvalid}
                className={`${inputClass({ invalid: amountInvalid })} tnum`}
              />

              {amountInvalid && (
                <p role="alert" className={errorClass}>
                  <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{formik.errors.amount}</span>
                </p>
              )}
            </section>

            {/* Screenshot */}
            <section>
              <p className={labelClass}>صورة إيصال التحويل</p>

              <div className="rounded-2xl border border-line bg-canvas p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="معاينة الإيصال"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageUp
                        size={26}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="text-brand-300"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-6 text-muted">
                      ارفع صورة واضحة لإيصال التحويل. الحد الأقصى{" "}
                      {MAX_SCREENSHOT_MB} ميجابايت.
                    </p>

                    <input
                      ref={inputRef}
                      id="payment-screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handlePick}
                      disabled={createMutation.isPending}
                      className="hidden"
                    />

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        as="label"
                        htmlFor="payment-screenshot"
                        variant="outline"
                        size="sm"
                        disabled={createMutation.isPending}
                        className={createMutation.isPending ? "" : "cursor-pointer"}
                      >
                        <ImageUp size={15} />
                        {screenshot ? "تغيير الصورة" : "اختر صورة"}
                      </Button>

                      {screenshot && !createMutation.isPending && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearFile}
                        >
                          <RotateCcw size={15} />
                          إزالة
                        </Button>
                      )}
                    </div>

                    {screenshot && (
                      <p className="mt-2 truncate text-[12px] text-ink-soft">
                        {screenshot.name}
                      </p>
                    )}
                  </div>
                </div>

                {fileError && (
                  <p role="alert" className={errorClass}>
                    <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{fileError}</span>
                  </p>
                )}
              </div>
            </section>

            <TextAreaField
              formik={formik}
              name="notes"
              label="ملاحظات (اختياري)"
              rows={3}
              maxLength={1000}
              placeholder="أي تفاصيل تساعد فريق المراجعة…"
            />

            {createMutation.isPending && typeof progress === "number" && (
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="رفع الإيصال"
              >
                <div
                  className="h-full rounded-full bg-brand-700 transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={createMutation.isPending}
            >
              <Send size={17} className="rtl:-scale-x-100" />
              {createMutation.isPending && typeof progress === "number"
                ? `جارٍ الإرسال ${progress}%`
                : "إرسال الدفعة"}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
