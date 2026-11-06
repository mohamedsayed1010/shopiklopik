import { useCallback, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Seo from "../Seo";

import { ensureSubmissionIdentity } from "../../utils/dynamicForm";
import { joinFieldErrors } from "../../utils/apiErrors";
import { reportApiError } from "../../utils/reportApiError";
import {
  adPaymentPagePath,
  createdAdvertisementId,
  paymentErrorText,
  paymentTarget,
} from "../../utils/adPaymentForm";
import ErrorSummary from "../ui/ErrorSummary";
import useCreateAdForm from "./useCreateAdForm";
import {
  INACTIVE_SUBCATEGORY_MESSAGE,
  useIsInactiveSubCategory,
} from "../../hooks/useListingModuleType";
import useDynamicForm from "./useDynamicForm";
import useCreateAdSubmit from "./useCreateAdSubmit";
import DynamicFormSections from "./DynamicFormSections";
import AdPaymentSection from "../payments/AdPaymentSection";
import useAdPaymentForm from "../payments/useAdPaymentForm";
import { useSubmitAdPayment } from "../../hooks/useAdPayment";
import PageHeader from "../ui/PageHeader";
import Steps from "../ui/Steps";
import Button from "../ui/Button";
import ErrorState from "../ui/ErrorState";
import Skeleton from "../ui/Skeleton";

const STEPS = ["القسم", "القسم الفرعي", "بيانات الإعلان"];

function FormSkeleton() {
  return (
    <div className="space-y-6 rounded-2xl border border-line bg-surface p-6">
      <Skeleton className="h-5 w-32" />

      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DynamicAdForm() {
  const navigate = useNavigate();

  const { categoryId, subCategoryId } = useParams();

  const { formData, isLoading, isError, error } = useCreateAdForm(
    categoryId,
    subCategoryId
  );

  const isInactive = useIsInactiveSubCategory(categoryId, subCategoryId, error);

  const fields = useMemo(() => formData?.fields ?? [], [formData]);

  /* Which form this is, as the config itself reports it. Endpoints shared by
     several sub-categories require it and the config never publishes it as a
     field — see `buildFormData`. */
  const submitContext = useMemo(
    () =>
      formData
        ? {
            categoryId: formData.category?.id,
            subCategoryId: formData.subCategory?.id,
            endpoint: formData.submit?.endpoint,
          }
        : null,
    [formData]
  );

  const {
    values,
    errors,
    visibleErrors,
    sections,
    handleChange,
    handleBlur,
    requiredFor,
    validate,
    buildFormData,
  } = useDynamicForm(fields, submitContext);

  /* Ad payment: a second form from the Lookup's `payment` block, shown only
     when this module is subject to payment and payments are switched on. It is
     submitted separately, after the advertisement exists. */
  const paymentForm = useAdPaymentForm(formData);

  const submitPayment = useSubmitAdPayment();

  /* The advertisement this page already created, when its payment has not gone
     through yet. While it is set, a retry sends the payment only — the
     advertisement is never created a second time. Tied to the form it was
     created from, so another category starts clean. */
  const [created, setCreated] = useState(null);

  const formIdentity = `${formData?.category?.id ?? ""}/${formData?.subCategory?.id ?? ""}`;

  const createdId = created?.form === formIdentity ? created.id : null;

  // Like `created`, a payment error belongs to the form it was raised on.
  const [paymentFailure, setPaymentFailure] = useState(null);

  const paymentError = paymentFailure?.form === formIdentity ? paymentFailure.message : null;

  const setPaymentError = (message) =>
    setPaymentFailure(message ? { message, form: formIdentity } : null);

  const formRef = useRef(null);

  const summaryRef = useRef(null);

  // Refuses a second create while the first is still on its way.
  const creating = useRef(false);

  /* What the server said about the last attempt, split into what belongs on a
     field and what belongs to the submission as a whole. Kept apart from the
     config-driven `errors` so re-validating never resurrects a stale one. */
  const [serverErrors, setServerErrors] = useState({
    fieldErrors: {},
    globalErrors: [],
  });

  const renderedFields = useMemo(
    () => sections.flatMap((section) => section.fields),
    [sections]
  );

  /* A server finding describes the request that was sent; the moment the user
     changes anything it no longer describes what is in the form. */
  const handleFieldChange = useCallback(
    (name, value) => {
      setServerErrors((previous) => {
        if (
          previous.globalErrors.length === 0 &&
          previous.fieldErrors[name] === undefined
        ) {
          return previous;
        }

        const fieldErrors = { ...previous.fieldErrors };

        delete fieldErrors[name];

        return { fieldErrors, globalErrors: [] };
      });

      handleChange(name, value);
    },
    [handleChange]
  );

  const paymentRequired = paymentForm.isRequired;

  const createAdMutation = useCreateAdSubmit({
    // With a payment step, the confirmation comes after the payment instead.
    successToast: !paymentRequired,
    onSuccess: () => {},
  });

  const scrollTo = (selector) =>
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector(selector)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

  /* Sends the payment proof for an advertisement this page created. On failure
     the advertisement stays created and remembered, and the payment values stay
     in the form, so the user can correct and retry the payment alone. */
  const sendPayment = async (advertisementId) => {
    const target = paymentTarget(formData, advertisementId);

    if (!target) {
      setPaymentError("تعذّر تجهيز طلب الدفع لهذا الإعلان. افتح صفحة الدفع من إعلاناتك وأكمل الدفع.");

      return;
    }

    setPaymentError(null);

    try {
      await submitPayment.submit({
        target,
        formData: paymentForm.buildFormData(),
        advertisementType: paymentForm.payment?.advertisementType,
        advertisementId,
      });

      toast.success("تم إرسال إعلانك وإثبات الدفع، وهما الآن قيد المراجعة.", { duration: 6000 });

      setCreated(null);

      const path = adPaymentPagePath({
        categoryId: formData.category?.id,
        subCategoryId: formData.subCategory?.id,
        advertisementId,
      });

      navigate(path ?? "/");
    } catch (failure) {
      if (failure?.duplicate) return;

      setPaymentError(paymentErrorText(failure));

      scrollTo('[data-field="ad-payment"]');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (creating.current || submitPayment.isSubmitting) return;

    // A form that is subject to payment never submits around an unknown config.
    if (paymentForm.gate === "loading" || paymentForm.gate === "error") {
      scrollTo('[data-field="ad-payment"]');

      return;
    }

    // The advertisement exists already: only the payment is (re)sent.
    if (createdId) {
      if (!paymentForm.validate()) {
        scrollTo(`[data-field="${Object.keys(paymentForm.errors)[0]}"]`);

        return;
      }

      await sendPayment(createdId);

      return;
    }

    /* Validation is config-driven, so a conditionally required field that has
       just appeared blocks submission exactly as the backend would. Both forms
       are checked before anything is sent. */
    const adValid = validate();

    const paymentValid = paymentRequired ? paymentForm.validate() : true;

    if (!adValid || !paymentValid) {
      const [firstInvalid] = !adValid
        ? Object.keys(errors)
        : Object.keys(paymentForm.errors);

      scrollTo(`[data-field="${firstInvalid}"]`);

      return;
    }

    const data = ensureSubmissionIdentity(buildFormData(), submitContext);

    // Last attempt is no longer what is being asked about.
    setServerErrors({ fieldErrors: {}, globalErrors: [] });

    setPaymentError(null);

    creating.current = true;

    let response;

    try {
      response = await createAdMutation.mutateAsync({
        endpoint: formData.submit.endpoint,
        method: formData.submit.method,
        formData: data,
      });
    } catch (failure) {
      const { fieldErrors, globalErrors } = reportApiError(failure, {
        fields: renderedFields,
        fallback: "تعذّر نشر الإعلان، حاول مرة أخرى",
        // Shown in the summary below instead — never in both places.
        toastGlobal: false,
      });

      setServerErrors({
        fieldErrors: joinFieldErrors(fieldErrors),
        globalErrors,
      });

      const [firstField] = Object.keys(fieldErrors);

      /* Take the reader to the finding: the summary when the server said
         something no field owns, otherwise the first field it named. */
      requestAnimationFrame(() => {
        const target =
          globalErrors.length > 0
            ? summaryRef.current
            : formRef.current?.querySelector(`[data-field="${firstField}"]`);

        target?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      return;
    } finally {
      creating.current = false;
    }

    if (!paymentRequired) {
      navigate("/");

      return;
    }

    const advertisementId = createdAdvertisementId(response);

    if (!advertisementId) {
      // Created, but the response did not say which id: never create it again.
      toast("تم إنشاء إعلانك. أكمل الدفع من صفحة إعلاناتك.", { duration: 8000 });

      navigate("/profile");

      return;
    }

    setCreated({ id: advertisementId, form: formIdentity });

    await sendPayment(advertisementId);
  };

  const busy = createAdMutation.isPending || submitPayment.isSubmitting;

  const paymentBlocked = paymentForm.gate === "loading" || paymentForm.gate === "error";

  const submitLabel = busy
    ? submitPayment.isSubmitting
      ? submitPayment.progress
        ? `جارٍ إرسال الدفع... ${submitPayment.progress}%`
        : "جارٍ إرسال الدفع..."
      : "جارٍ النشر..."
    : createdId
      ? "إعادة إرسال الدفع"
      : "نشر الإعلان";

  return (
    <>
      <Seo
        title={
          formData?.subCategory?.nameAr
            ? `إضافة إعلان في ${formData.subCategory.nameAr}`
            : "إضافة إعلان جديد"
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          eyebrow={formData?.subCategory?.nameAr}
          title="بيانات الإعلان"
          subtitle="كلما كانت البيانات أدق، زادت فرص بيع إعلانك بسرعة"
          className="mb-6"
        />

        <Steps steps={STEPS} current={2} className="mb-8" />

        {isLoading ? (
          <FormSkeleton />
        ) : isInactive ? (
          <ErrorState
            title={INACTIVE_SUBCATEGORY_MESSAGE}
            description="لا يمكن تصفّح هذا القسم أو إضافة إعلانات إليه الآن. يمكنك تصفّح باقي الأقسام."
          />
        ) : isError || !formData ? (
          <ErrorState
            title="تعذّر تحميل نموذج الإعلان"
            description="لم نتمكن من تحميل حقول هذا القسم. حاول مرة أخرى."
          />
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div ref={summaryRef}>
              <ErrorSummary
                messages={serverErrors.globalErrors}
                title="تعذّر نشر الإعلان"
                className="mb-6"
              />
            </div>

            {createdId && (
              <p
                role="status"
                className="mb-6 rounded-xl bg-gold-50 px-4 py-3 text-[13px] leading-6 text-ink-soft ring-1 ring-inset ring-gold-200"
              >
                تم إنشاء إعلانك ولم يكتمل الدفع بعد. بيانات الإعلان محفوظة ولن تُرسل مرة أخرى؛
                راجع بيانات الدفع ثم اضغط «إعادة إرسال الدفع».
              </p>
            )}

            {/* Locked once created: the advertisement exists, only its payment is pending. */}
            <fieldset disabled={Boolean(createdId) || busy} className="min-w-0">
              <DynamicFormSections
                sections={sections}
                values={values}
                /* The server has the last word on a field it named: it judged
                   the request that was actually sent, while the client rule only
                   judged the shape of it. */
                errors={{ ...visibleErrors, ...serverErrors.fieldErrors }}
                lookups={formData.lookups}
                requiredFor={requiredFor}
                onChange={handleFieldChange}
                onBlur={handleBlur}
              />
            </fieldset>

            <div className="mt-6 space-y-3">
              <AdPaymentSection
                paymentForm={paymentForm}
                errors={paymentForm.visibleErrors}
                disabled={busy}
              />

              <ErrorSummary
                messages={paymentError ? [paymentError] : []}
                title="لم يكتمل إرسال الدفع"
              />
            </div>

            {/* Submit — sticky rather than fixed, so it stays in flow: it pins
                while the form scrolls and settles below the last section
                instead of covering it. Below lg it clears the BottomNav, whose
                height includes the safe-area inset. */}
            <div className=" mt-6 border-t border-line bg-canvas/95 py-4 backdrop-blur-sm max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))]">
              <div className="flex flex-row-reverse gap-3">

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(-1)}
                  disabled={busy}
                  className="w-28 shrink-0 sm:w-40"
                >
                  تراجع
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  loading={busy}
                  disabled={paymentBlocked}
                  className="min-w-0 flex-1"
                >
                  {submitLabel}
                </Button>

              </div>

              <p className="mt-3 text-center text-xs text-muted">
                بالنشر أنت توافق على أن البيانات المدخلة صحيحة ومسؤوليتك
                الشخصية.
              </p>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
