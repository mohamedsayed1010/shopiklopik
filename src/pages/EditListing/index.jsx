import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Seo from "../../components/Seo";
import { Lock, RotateCcw, X } from "lucide-react";

import useReadConfig from "../../hooks/useReadConfig";
import useCharityModule from "../../hooks/charity/useCharityModule";
import useDynamicDetails from "../../hooks/useDynamicDetails";
import useCreateAdForm from "../../components/CreateAd/useCreateAdForm";
import useDynamicForm from "../../components/CreateAd/useDynamicForm";
import useAdvertisementActions from "../../hooks/useAdvertisementActions";
import useUpdateListing from "./useUpdateListing";

import DynamicFormSections from "../../components/CreateAd/DynamicFormSections";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import ErrorSummary from "../../components/ui/ErrorSummary";

import {
  buildJsonBody,
  entityToFormValues,
  fieldsWithExistingMedia,
  REMOVE_IMAGES_FIELD,
  removableImagesOf,
  supportsImageRemoval,
  updatesAsJson,
} from "../../utils/dynamicForm";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { fillEndpoint } from "../../utils/listingEndpoint";
import { joinFieldErrors } from "../../utils/apiErrors";
import { reportApiError } from "../../utils/reportApiError";


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

export default function EditListingPage() {
  const navigate = useNavigate();

  const { categoryId, subCategoryId, id } = useParams();

  const {
    config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    refetch: refetchConfig,
  } = useReadConfig(Number(categoryId), Number(subCategoryId));

  const { module: charityModule } = useCharityModule(
    Number(categoryId),
    Number(subCategoryId)
  );

  /* The module's own address for this record — the same one the details page
     reads, delete removes and republish extends. Declared by the module, never
     built from its browsing route: see `listingEndpoint`. */
  const endpoint = useMemo(() => {
    const template =
      config?.details?.endpoint ??
      (charityModule ? `${charityModule.endpoint}/{id}` : null);

    return fillEndpoint(template, id) ?? "";
  }, [config, charityModule, id]);

  const {
    item,
    isLoading: isItemLoading,
    isError: isItemError,
    refetch: refetchItem,
  } = useDynamicDetails(endpoint);

  const {
    formData,
    isLoading: isFormLoading,
    isError: isFormError,
  } = useCreateAdForm(categoryId, subCategoryId);

  const fields = useMemo(() => formData?.fields ?? [], [formData]);

  /* Permissions come from the server, never from comparing ids in the client.
     Only an explicit `false` closes the page: if this call fails the form still
     opens, and the `PUT` itself is the authority that rejects a stranger. */
  const { actions, isLoading: isActionsLoading } = useAdvertisementActions({
    id,
    categoryId: Number(categoryId),
    subCategoryId: Number(subCategoryId),
  });

  const isForbidden =
    actions !== null && (actions.isOwner === false || actions.canEdit === false);

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

  /* Memoised because `useDynamicForm` re-seeds whenever this identity changes —
     a fresh object each render would wipe out what the user is typing. */
  const initialValues = useMemo(
    () => (fields.length && item ? entityToFormValues(fields, item) : null),
    [fields, item]
  );

  /* A required photo field is already satisfied by the photos the listing has —
     the picker is empty because the server returns URLs, not files. Without
     this, a listing with images could never be edited at all. */
  const satisfiedFields = useMemo(
    () => (fields.length && item ? fieldsWithExistingMedia(fields, item) : null),
    [fields, item]
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
  } = useDynamicForm(fields, submitContext, initialValues, satisfiedFields);

  const canRemoveImages = supportsImageRemoval({
    formData,
    readConfig: config,
    item,
    endpoint: submitContext?.endpoint,
  });

  const existingImages = useMemo(
    () => (canRemoveImages ? removableImagesOf(item) : []),
    [canRemoveImages, item]
  );

  const [removedImageIds, setRemovedImageIds] = useState(() => new Set());

  const toggleImageRemoval = useCallback((imageId) => {
    setRemovedImageIds((previous) => {
      const next = new Set(previous);

      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);

      return next;
    });
  }, []);

  /* Cars take JSON on update where every other module takes multipart — see
     `updatesAsJson`. The decision is the config's endpoint, so it needs no
     knowledge of which category this is. */
  const buildBody = () => {
    if (updatesAsJson(submitContext?.endpoint)) {
      return buildJsonBody(fields, values, submitContext);
    }

    const body = buildFormData();

    /* Appended one id per entry, the same way `buildFormData` appends every
       other array — a single comma-joined value binds to one element on the
       server rather than to the list. */
    if (canRemoveImages) {
      removedImageIds.forEach((imageId) =>
        body.append(REMOVE_IMAGES_FIELD, imageId)
      );
    }

    return body;
  };

  const formRef = useRef(null);

  const summaryRef = useRef(null);

  /* Same contract as publishing — see `DynamicAdForm`. The update endpoints
     validate the same way the create ones do, so the findings are read and
     placed the same way. */
  const [serverErrors, setServerErrors] = useState({
    fieldErrors: {},
    globalErrors: [],
  });

  const renderedFields = useMemo(
    () => sections.flatMap((section) => section.fields),
    [sections]
  );

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

  const detailsPath = `/dynamic/${categoryId}/${subCategoryId}/${id}`;

  const updateMutation = useUpdateListing({
    onSuccess: () => navigate(detailsPath, { replace: true }),
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      const [firstInvalid] = Object.keys(errors);

      const node = formRef.current?.querySelector(`[data-field="${firstInvalid}"]`);

      node?.scrollIntoView({ behavior: "smooth", block: "center" });

      return;
    }

    setServerErrors({ fieldErrors: {}, globalErrors: [] });

    updateMutation.mutate(
      { endpoint, body: buildBody() },
      {
        onError: (error) => {
          const { fieldErrors, globalErrors } = reportApiError(error, {
            fields: renderedFields,
            fallback: "تعذّر حفظ التعديلات",
            toastGlobal: false,
          });

          setServerErrors({
            fieldErrors: joinFieldErrors(fieldErrors),
            globalErrors,
          });

          const [firstField] = Object.keys(fieldErrors);

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

  const subCategoryName =
    config?.subCategory?.nameAr ??
    config?.subCategory?.name ??
    formData?.subCategory?.nameAr ??
    charityModule?.title;

  const isBusy =
    isConfigLoading || isItemLoading || isFormLoading || isActionsLoading;

  const isError =
    (isConfigError && !charityModule) || isItemError || isFormError;

  return (
    <>
      <Seo title="تعديل الإعلان" />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          eyebrow={subCategoryName}
          title="تعديل الإعلان"
          subtitle="عدّل ما تريد ثم احفظ — سيظهر التحديث على إعلانك مباشرة"
          className="mb-8"
        />

        {isBusy ? (
          <FormSkeleton />
        ) : isError || !formData ? (
          <ErrorState
            title="تعذّر تحميل الإعلان للتعديل"
            description="لم نتمكن من تحميل بيانات هذا الإعلان. حاول مرة أخرى."
            onRetry={isConfigError ? refetchConfig : refetchItem}
          />
        ) : isForbidden ? (
          <EmptyState
            icon={Lock}
            title="لا يمكنك تعديل هذا الإعلان"
            description="التعديل متاح لصاحب الإعلان فقط."
            action={
              <Button onClick={() => navigate(detailsPath, { replace: true })}>
                عرض الإعلان
              </Button>
            }
          />
        ) : !item ? (
          <EmptyState
            title="الإعلان غير متاح"
            description="لم نعثر على هذا الإعلان. ربما تم حذفه."
          />
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div ref={summaryRef}>
              <ErrorSummary
                messages={serverErrors.globalErrors}
                title="تعذّر حفظ التعديلات"
                className="mb-6"
              />
            </div>

            <DynamicFormSections
              sections={sections}
              values={values}
              errors={{ ...visibleErrors, ...serverErrors.fieldErrors }}
              lookups={formData.lookups}
              requiredFor={requiredFor}
              onChange={handleFieldChange}
              onBlur={handleBlur}
            />

            {existingImages.length > 0 && (
              <section className="mt-6 rounded-2xl border border-line bg-surface p-4">
                <h2 className="text-[14px] font-bold text-ink">الصور الحالية</h2>

                <p className="mt-1 text-[12.5px] leading-6 text-muted">
                  اضغط على صورة لتحديدها للحذف. تُحذف عند حفظ التعديلات، ويمكنك
                  التراجع قبل الحفظ.
                </p>

                <ul className="mt-3 flex flex-wrap gap-3">
                  {existingImages.map((image) => {
                    const marked = removedImageIds.has(image.id);

                    return (
                      <li key={image.id}>
                        <button
                          type="button"
                          onClick={() => toggleImageRemoval(image.id)}
                          aria-pressed={marked}
                          aria-label={
                            marked ? "التراجع عن حذف الصورة" : "تحديد الصورة للحذف"
                          }
                          className={`group relative block h-24 w-24 overflow-hidden rounded-xl border transition-colors duration-200 ${
                            marked
                              ? "border-red-400 ring-2 ring-inset ring-red-300"
                              : "border-line hover:border-line-strong"
                          }`}
                        >
                          <img
                            src={resolveMediaUrl(image.url)}
                            alt=""
                            className={`h-full w-full object-cover transition-opacity duration-200 ${
                              marked ? "opacity-40" : ""
                            }`}
                          />

                          <span
                            aria-hidden="true"
                            className={`absolute top-1 rounded-full p-1 text-white shadow-sm end-1 ${
                              marked ? "bg-slate-700" : "bg-red-600"
                            }`}
                          >
                            {marked ? <RotateCcw size={12} /> : <X size={12} />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {removedImageIds.size > 0 && (
                  <p className="tnum mt-3 text-[12.5px] font-medium text-red-600">
                    {removedImageIds.size} صورة ستُحذف عند الحفظ.
                  </p>
                )}
              </section>
            )}

            <p className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-muted">
              {existingImages.length > 0
                ? "أضف ملفات جديدة لإضافتها إلى الصور الحالية."
                : "الصور والملفات المرفوعة سابقًا محفوظة كما هي. أضف ملفات جديدة فقط إذا أردت تحديثها."}
            </p>

            <div className="sticky bottom-0 z-20 mt-6 border-t border-line bg-canvas/95 py-4 backdrop-blur-sm max-lg:bottom-16">
              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  loading={updateMutation.isPending}
                  className="sm:flex-1"
                >
                  {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(-1)}
                  disabled={updateMutation.isPending}
                  className="sm:w-40"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
