import { useCallback, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Seo from "../Seo";

import { ensureSubmissionIdentity } from "../../utils/dynamicForm";
import { joinFieldErrors } from "../../utils/apiErrors";
import { reportApiError } from "../../utils/reportApiError";
import ErrorSummary from "../ui/ErrorSummary";
import useCreateAdForm from "./useCreateAdForm";
import useDynamicForm from "./useDynamicForm";
import useCreateAdSubmit from "./useCreateAdSubmit";
import DynamicFormSections from "./DynamicFormSections";
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

  const { formData, isLoading, isError } = useCreateAdForm(
    categoryId,
    subCategoryId
  );

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

  const formRef = useRef(null);

  const summaryRef = useRef(null);

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

  const createAdMutation = useCreateAdSubmit({
    onSuccess: () => {
      navigate("/");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    /* Validation is config-driven, so a conditionally required field that has
       just appeared blocks submission exactly as the backend would. */
    if (!validate()) {
      const [firstInvalid] = Object.keys(errors);

      const node = formRef.current?.querySelector(`[data-field="${firstInvalid}"]`);

      node?.scrollIntoView({ behavior: "smooth", block: "center" });

      return;
    }

    const data = ensureSubmissionIdentity(buildFormData(), submitContext);

    // Last attempt is no longer what is being asked about.
    setServerErrors({ fieldErrors: {}, globalErrors: [] });

    createAdMutation.mutate(
      {
        endpoint: formData.submit.endpoint,
        method: formData.submit.method,
        formData: data,
      },
      {
        /* Attached per call rather than to the hook so the field set the
           messages are matched against is the one that was on screen when
           this submission left. */
        onError: (error) => {
          const { fieldErrors, globalErrors } = reportApiError(error, {
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
                : formRef.current?.querySelector(
                    `[data-field="${firstField}"]`
                  );

            target?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        },
      }
    );
  };

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

            {/* Submit */}
            <div className="sticky bottom-0 z-20 mt-6 border-t border-line bg-canvas/95 py-4 backdrop-blur-sm max-lg:bottom-16">
              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  loading={createAdMutation.isPending}
                  className="sm:flex-1"
                >
                  {createAdMutation.isPending ? "جارٍ النشر..." : "نشر الإعلان"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(-1)}
                  disabled={createAdMutation.isPending}
                  className="sm:w-40"
                >
                  رجوع
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
