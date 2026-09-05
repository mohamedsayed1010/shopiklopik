import { useEffect, useMemo, useRef, useState } from "react";
import Seo from "../../components/Seo";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Crop,
  ImageUp,
  Loader2,
  Megaphone,
  RotateCcw,
  ScanLine,
  Send,
} from "lucide-react";

import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import TextField, { TextAreaField } from "../../components/ui/TextField";
import Switch from "../../components/ui/Switch";
import PaymentMethodInfo from "../../components/payments/PaymentMethodInfo";
import BannerCropDialog from "../../components/banners/BannerCropDialog";
import {
  errorClass,
  labelClass,
  selectClass,
} from "../../components/ui/formStyles";
import useCategoriesTree from "../../components/CreateAd/useCategoriesTree";
import { useBannerPlacements } from "../../hooks/useBanners";
import {
  useBannerAvailability,
  useBannerImagePreview,
  useBannerPaymentMethods,
  useBannerQuote,
  useCreateBannerBooking,
} from "../../hooks/useBannerBooking";
import { formatFormats } from "../../utils/bannerModel";
import { processBannerImage } from "../../utils/bannerImageProcessing";
import { formatMoney, formatDate } from "../../utils/format";
import { apiErrorText } from "../../utils/apiErrors";

const MAX_UPLOAD_MB = 10;

const MB = 1024 * 1024;

const validationSchema = Yup.object({
  title: Yup.string().trim().required("عنوان البانر مطلوب").max(200, "طويل جدًا"),

  description: Yup.string().trim().max(1000, "الحد الأقصى 1000 حرف"),

  buttonText: Yup.string()
    .trim()
    .required("نص الزر مطلوب")
    .max(50, "الحد الأقصى 50 حرفًا"),

  targetUrl: Yup.string()
    .trim()
    .required("رابط الإعلان مطلوب")
    .matches(/^(https:\/\/\S+|\/\S*)$/, {
      message: "استخدم رابطًا يبدأ بـ https:// أو مسارًا داخل التطبيق يبدأ بـ /",
    }),

  advertiserName: Yup.string().trim().required("اسم المُعلن مطلوب"),

  phoneNumber: Yup.string()
    .trim()
    .required("رقم الهاتف مطلوب")
    .matches(/^[\d\s+()-]{6,}$/, "أدخل رقمًا صحيحًا"),

  whatsAppNumber: Yup.string()
    .trim()
    .matches(/^[\d\s+()-]{6,}$/, {
      message: "أدخل رقمًا صحيحًا",
      excludeEmptyString: true,
    }),

  email: Yup.string().trim().email("أدخل بريدًا صحيحًا"),
});

/** A file picker with preview, used for the two artworks and the proof. */
function FilePicker({ id, label, hint, file, onPick, onClear, error, disabled }) {
  const inputRef = useRef(null);

  /* Derived, not stored: the URL is a pure function of the picked file, so
     there is nothing to synchronise and no setState in an effect. The effect
     exists only to revoke it — an object URL pins its blob until it is. */
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    if (!previewUrl) return undefined;

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div className="rounded-2xl border border-line bg-canvas p-4">
      <p className="text-[13px] font-bold text-ink">{label}</p>

      {hint && <p className="mt-1 text-[12px] leading-6 text-muted">{hint}</p>}

      <div className="mt-3 flex flex-wrap items-start gap-4">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`معاينة ${label}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageUp
              size={22}
              strokeWidth={1.5}
              aria-hidden="true"
              className="text-brand-300"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={(event) => {
              const picked = event.target.files?.[0];

              if (picked) onPick(picked);
            }}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              as="label"
              htmlFor={id}
              variant="outline"
              size="sm"
              disabled={disabled}
              className={disabled ? "" : "cursor-pointer"}
            >
              <ImageUp size={15} />
              {file ? "تغيير" : "اختر صورة"}
            </Button>

            {file && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClear();

                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <RotateCcw size={15} />
                إزالة
              </Button>
            )}
          </div>

          {file && (
            <p className="mt-2 truncate text-[12px] text-ink-soft">{file.name}</p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className={errorClass}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function ArtworkPicker({
  id,
  label,
  spec,
  art,
  busy,
  onPick,
  onRecrop,
  onClear,
  error,
  disabled,
}) {
  const inputRef = useRef(null);

  const processed = art?.result ?? null;

  /* Derived from the processed file, revoked when it changes — the preview is
     purely local and costs no request. */
  const previewUrl = useMemo(
    () => (processed?.file ? URL.createObjectURL(processed.file) : null),
    [processed]
  );

  useEffect(() => {
    if (!previewUrl) return undefined;

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const required = spec?.resolution || (spec?.width ? `${spec.width} × ${spec.height} px` : null);

  return (
    <div className="rounded-2xl border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px] font-bold text-ink">{label}</p>

        {required && (
          <p className="tnum text-[11.5px] text-muted">
            المطلوب: {required}
            {formatFormats(spec) ? ` · ${formatFormats(spec)}` : ""}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-start gap-4">
        {/* The frame matches the placement's own proportions, so the thumbnail
            is a faithful miniature of the final artwork. */}
        <div
          style={{
            aspectRatio:
              spec?.width && spec?.height ? `${spec.width} / ${spec.height}` : "3 / 1",
          }}
          className="flex w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface"
        >
          {busy ? (
            <Loader2
              size={20}
              aria-hidden="true"
              className="animate-spin text-brand-400"
            />
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={`المعاينة النهائية — ${label}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageUp
              size={22}
              strokeWidth={1.5}
              aria-hidden="true"
              className="text-brand-300"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            disabled={disabled || busy}
            /* Cleared on every open: an input whose value has not changed
               fires no `change`, so an advertiser who closed the cropper and
               reached for the same file again would have got nothing. */
            onClick={(event) => {
              event.currentTarget.value = "";
            }}
            onChange={(event) => {
              const picked = event.target.files?.[0];

              if (picked) onPick(picked);
            }}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              as="label"
              htmlFor={id}
              variant="outline"
              size="sm"
              disabled={disabled || busy}
              className={disabled || busy ? "" : "cursor-pointer"}
            >
              <ImageUp size={15} />
              {processed ? "تغيير الصورة" : "اختر صورة"}
            </Button>

            {processed && !disabled && !busy && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRecrop}
              >
                <Crop size={15} />
                إعادة القص
              </Button>
            )}

            {processed && !disabled && !busy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClear();

                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <RotateCcw size={15} />
                إزالة
              </Button>
            )}
          </div>

          {/* What happened to the file, stated plainly. */}
          {processed && (
            <dl className="mt-3 space-y-1 text-[11.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">الصورة الأصلية</dt>
                <dd className="tnum font-semibold text-ink">
                  {processed.source.width} × {processed.source.height} px
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-muted">بعد المعالجة</dt>
                <dd className="tnum font-semibold text-emerald-700">
                  {processed.target.width} × {processed.target.height} px
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-muted">حجم الملف</dt>
                <dd className="tnum font-semibold text-ink">
                  {(processed.bytes / 1024 / 1024).toFixed(2)} ميجابايت
                </dd>
              </div>
            </dl>
          )}

          {processed && (
            <p
              className={`mt-2 flex items-start gap-1.5 text-[11.5px] leading-5 ${
                processed.cropped ? "text-gold-700" : "text-emerald-700"
              }`}
            >
              {processed.cropped ? (
                <>
                  <Crop size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    تم قص الصورة بالإطار الذي اخترته. المعاينة أعلاه هي الصورة
                    النهائية التي سترسل — اضغط «إعادة القص» لتعديلها.
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={13}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {processed.wasProcessed
                      ? "تم ضبط المقاس دون قص. الصورة جاهزة للإرسال."
                      : "الصورة بالمقاس المطلوب تمامًا وجاهزة للإرسال."}
                  </span>
                </>
              )}
            </p>
          )}

          {processed && (
            <p className="mt-1 truncate text-[11.5px] text-muted">
              {art.original.name}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className={errorClass}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;

  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="shrink-0 text-[12px] text-muted">{label}</dt>

      <dd className="min-w-0 text-end text-[12.5px] font-semibold text-ink">
        {value}
      </dd>
    </div>
  );
}

export default function BannerBookingPage() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const { placements, placementsQuery } = useBannerPlacements();

  /* Names for the two category selects. Shares the app's existing
     ["categories-tree"] query, so no extra request is made. */
  const { categories, isLoading: categoriesLoading } = useCategoriesTree();

  /* Seeded from the call to action that opened this page. */
  const [location, setLocation] = useState(searchParams.get("location") ?? "");

  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") ?? ""
  );

  const [subCategoryId, setSubCategoryId] = useState(
    searchParams.get("subCategoryId") ?? ""
  );

  const [slotNumber, setSlotNumber] = useState("");

  const [paymentMethodId, setPaymentMethodId] = useState("");

  const [desktopArt, setDesktopArt] = useState(null);

  const [mobileArt, setMobileArt] = useState(null);

  const [processing, setProcessing] = useState({});

  /* The artwork currently being framed, or `null` when the cropper is shut.
     One dialog serves both slots — they are never open at the same time — so
     it carries the slot it belongs to rather than being duplicated per slot. */
  const [cropTarget, setCropTarget] = useState(null);

  const ART_SETTERS = { desktop: setDesktopArt, mobile: setMobileArt };

  const desktopImage = desktopArt?.result?.file ?? null;

  const mobileImage = mobileArt?.result?.file ?? null;

  const [paymentProof, setPaymentProof] = useState(null);

  const [fileErrors, setFileErrors] = useState({});

  const [accepted, setAccepted] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const placement = useMemo(
    () => placements.find((row) => String(row.location) === String(location)),
    [placements, location]
  );

  const availabilityQuery = useBannerAvailability({
    location: location === "" ? undefined : Number(location),
    categoryId: categoryId === "" ? undefined : Number(categoryId),
    subCategoryId: subCategoryId === "" ? undefined : Number(subCategoryId),
  });

  const availability = availabilityQuery.data?.data ?? null;

  const { methods, methodsQuery } = useBannerPaymentMethods();

  const quoteQuery = useBannerQuote({
    location: location === "" ? undefined : Number(location),
    slotNumber: slotNumber === "" ? undefined : Number(slotNumber),
    categoryId: categoryId === "" ? undefined : Number(categoryId),
    subCategoryId: subCategoryId === "" ? undefined : Number(subCategoryId),
    paymentMethodId:
      paymentMethodId === "" ? undefined : Number(paymentMethodId),
  });

  const quote = quoteQuery.data?.data ?? null;

  const preview = useBannerImagePreview();

  const create = useCreateBannerBooking({
    onDone: () => navigate("/", { replace: true }),
  });

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      buttonText: "",
      targetUrl: "",
      advertiserName: "",
      phoneNumber: "",
      whatsAppNumber: "",
      email: "",
    },
    validationSchema,
    onSubmit: (values) => {
      setSubmitAttempted(true);

      const errors = {};

      if (!desktopImage) errors.desktop = "صورة سطح المكتب مطلوبة";

      if (!mobileImage) errors.mobile = "صورة الهاتف مطلوبة";

      if (!paymentProof) errors.proof = "إثبات الدفع مطلوب";

      setFileErrors(errors);

      if (Object.keys(errors).length > 0) return;

      if (!location || !slotNumber || !paymentMethodId || !accepted) return;

      if (create.mutation.isPending) return;

      create.submit({
        ...values,
        location: Number(location),
        slotNumber: Number(slotNumber),
        categoryId: categoryId === "" ? undefined : Number(categoryId),
        subCategoryId:
          subCategoryId === "" ? undefined : Number(subCategoryId),
        paymentMethodId: Number(paymentMethodId),
        desktopImage,
        mobileImage,
        paymentProof,
        confirmationAccepted: accepted,
      });
    },
  });

  const pickFile = (setter, key) => (file) => {
    if (!file.type.startsWith("image/")) {
      setFileErrors((previous) => ({
        ...previous,
        [key]: "الملف يجب أن يكون صورة",
      }));

      return;
    }

    if (file.size > MAX_UPLOAD_MB * MB) {
      setFileErrors((previous) => ({
        ...previous,
        [key]: `الحجم الأقصى ${MAX_UPLOAD_MB} ميجابايت`,
      }));

      return;
    }

    setFileErrors((previous) => ({ ...previous, [key]: undefined }));

    setter(file);
  };

  const pickArtwork = (key, label, spec) => (file) => {
    if (!file.type.startsWith("image/")) {
      setFileErrors((previous) => ({
        ...previous,
        [key]: "الملف يجب أن يكون صورة",
      }));

      return;
    }

    if (!spec?.width || !spec?.height) {
      setFileErrors((previous) => ({
        ...previous,
        [key]: "اختر المساحة أولًا حتى نعرف المقاس المطلوب",
      }));

      return;
    }

    setFileErrors((previous) => ({ ...previous, [key]: undefined }));

    setCropTarget({ key, label, spec, file });
  };

  /** Reopen the cropper on an artwork that is already placed, box and all. */
  const recropArtwork = (key, label, spec, art) => () => {
    if (!art?.original || !spec?.width) return;

    /* The untouched original, not the processed copy: re-cropping has to start
       from the whole picture, and passing the same object is also what tells
       the dialog to resume the box instead of resetting it. */
    setCropTarget({ key, label, spec, file: art.original });
  };

  const confirmCrop = async (area) => {
    if (!cropTarget) return;

    const { key, file, spec } = cropTarget;

    setProcessing((previous) => ({ ...previous, [key]: true }));

    try {
      const result = await processBannerImage(file, spec, { crop: area });

      ART_SETTERS[key]?.({ original: file, result, crop: area });

      setCropTarget(null);
    } catch (error) {
      ART_SETTERS[key]?.(null);

      setFileErrors((previous) => ({
        ...previous,
        [key]: error?.message || "تعذّرت معالجة الصورة",
      }));

      setCropTarget(null);
    } finally {
      setProcessing((previous) => ({ ...previous, [key]: false }));
    }
  };

  const selectedMethod = methods.find(
    (entry) => String(entry.method?.id) === String(paymentMethodId)
  );

  const slots = availability?.slots ?? [];

  const durationDisplay =
    availability?.placement?.durationDisplay ??
    placement?.durationDisplay ??
    null;

  const needsSubCategory = placement?.requiresSubCategory === true;

  /* The sub-categories under the chosen category. The tree is the app's
     existing `["categories-tree"]` query, so this reuses whatever the rest of
     the app has already loaded rather than adding a request. */
  const subCategories =
    categories.find((category) => String(category.id) === String(categoryId))
      ?.subCategories ?? [];

  const quoteStatus = quoteQuery.error?.response?.status;

  return (
    <>
      <Seo title="حجز مساحة إعلانية" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[820px] px-4 py-6 pb-24 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="الإعلانات"
          title="حجز مساحة إعلانية"
          subtitle="اختر المساحة، ارفع التصميم، ثم أرسل إثبات التحويل للمراجعة."
        />

        {placementsQuery.isLoading ? (
          <div className="mt-7 space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : placementsQuery.isError ? (
          <ErrorState
            className="mt-7"
            title="تعذّر تحميل المساحات"
            description="حدث خطأ أثناء جلب المساحات المتاحة. حاول مرة أخرى."
            onRetry={placementsQuery.refetch}
          />
        ) : placements.length === 0 ? (
          <EmptyState
            className="mt-7"
            icon={Megaphone}
            title="لا توجد مساحات إعلانية"
            description="لم تُفعّل إدارة المنصة أي مساحة إعلانية حتى الآن."
          />
        ) : (
          <form onSubmit={formik.handleSubmit} noValidate className="mt-7 space-y-6">
            {/* Placement */}
            <section>
              <h2 className="mb-3 text-[15px] font-bold text-ink">المساحة</h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {placements.map((row) => {
                  const active = String(row.location) === String(location);

                  return (
                    <button
                      key={row.location}
                      type="button"
                      onClick={() => {
                        setLocation(String(row.location));

                        setSlotNumber("");
                      }}
                      className={`cursor-pointer rounded-2xl border p-4 text-start transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 ${
                        active
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                          : "border-line bg-surface hover:border-brand-200"
                      }`}
                    >
                      <span className="block text-[14px] font-bold text-ink">
                        {row.locationName}
                      </span>

                      <span className="mt-1 block text-[12.5px] text-muted">
                        {row.priceDisplay ||
                          formatMoney(row.price, row.currency)}
                        {row.durationDisplay ? ` · ${row.durationDisplay}` : ""}
                      </span>

                      {row.desktop?.resolution && (
                        <span className="mt-1 block text-[11.5px] text-muted">
                          {row.desktop.resolution} · {formatFormats(row.desktop)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {needsSubCategory && (
              <section className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="categoryId" className={labelClass}>
                    القسم
                  </label>

                  <div className="relative">
                    <select
                      id="categoryId"
                      value={categoryId}
                      onChange={(event) => {
                        setCategoryId(event.target.value);

                        /* A sub-category only exists under its category, so the
                           old one cannot survive a change of parent. */
                        setSubCategoryId("");
                      }}
                      disabled={categoriesLoading}
                      className={selectClass()}
                    >
                      <option value="">
                        {categoriesLoading ? "جارٍ التحميل…" : "اختر القسم"}
                      </option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nameAr}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subCategoryId" className={labelClass}>
                    القسم الفرعي
                  </label>

                  <div className="relative">
                    <select
                      id="subCategoryId"
                      value={subCategoryId}
                      onChange={(event) => setSubCategoryId(event.target.value)}
                      disabled={categoriesLoading || categoryId === ""}
                      className={selectClass()}
                    >
                      <option value="">
                        {categoryId === ""
                          ? "اختر القسم أولًا"
                          : "اختر القسم الفرعي"}
                      </option>

                      {subCategories.map((subCategory) => (
                        <option key={subCategory.id} value={subCategory.id}>
                          {subCategory.nameAr}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Availability + slot */}
            {location !== "" && (
              <section>
                <h2 className="mb-3 text-[15px] font-bold text-ink">
                  المساحة المتاحة
                </h2>

                {availabilityQuery.isLoading ? (
                  <Skeleton className="h-28 rounded-2xl" />
                ) : availabilityQuery.isError ? (
                  <p className="rounded-2xl border border-line bg-canvas px-4 py-4 text-[13px] text-muted">
                    تعذّر جلب التوفّر لهذه المساحة.
                  </p>
                ) : availability ? (
                  <>
                    <div
                      className={`rounded-2xl border px-4 py-3.5 ${
                        availability.isAvailable
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-gold-300 bg-gold-50"
                      }`}
                    >
                      <p className="text-[13px] font-bold text-ink">
                        {availability.locationName}
                      </p>

                      {availability.message && (
                        <p className="mt-1 text-[12.5px] leading-6 text-ink-soft">
                          {availability.message}
                        </p>
                      )}

                      {durationDisplay && (
                        <p className="mt-1 text-[12px] text-muted">
                          مدة الحجز: {durationDisplay}
                        </p>
                      )}

                      {(availability.nextStartDate ||
                        availability.nextEndDate) && (
                        <p className="tnum mt-1 text-[11.5px] text-muted">
                          الفترة:{" "}
                          {availability.nextStartDate
                            ? formatDate(availability.nextStartDate)
                            : "—"}{" "}
                          ←{" "}
                          {availability.nextEndDate
                            ? formatDate(availability.nextEndDate)
                            : "—"}
                        </p>
                      )}
                    </div>

                    {slots.length > 0 && (
                      <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
                        {slots.map((slot) => {
                          const active =
                            String(slot.slotNumber) === String(slotNumber);

                          return (
                            <li key={slot.slotNumber}>
                              <button
                                type="button"
                                disabled={!slot.isAvailable}
                                onClick={() =>
                                  setSlotNumber(String(slot.slotNumber))
                                }
                                className={`w-full rounded-xl border px-3.5 py-3 text-start transition-colors duration-200 ${
                                  !slot.isAvailable
                                    ? "cursor-not-allowed border-line bg-canvas opacity-60"
                                    : active
                                    ? "cursor-pointer border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                                    : "cursor-pointer border-line bg-surface hover:border-brand-200"
                                }`}
                              >
                                <span className="block text-[12.5px] font-bold text-ink">
                                  {slot.slotName || `#${slot.slotNumber}`}
                                </span>

                                <span className="mt-0.5 block text-[11.5px] text-muted">
                                  {slot.statusName ||
                                    (slot.isAvailable ? "متاح" : "محجوز")}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : null}
              </section>
            )}

            {/* Artwork */}
            <section className="space-y-4">
              <h2 className="text-[15px] font-bold text-ink">التصميم</h2>

              <ArtworkPicker
                id="desktop-image"
                label="صورة سطح المكتب"
                spec={placement?.desktop}
                art={desktopArt}
                busy={Boolean(processing.desktop)}
                onPick={pickArtwork("desktop", "صورة سطح المكتب", placement?.desktop)}
                onRecrop={recropArtwork(
                  "desktop",
                  "صورة سطح المكتب",
                  placement?.desktop,
                  desktopArt
                )}
                onClear={() => setDesktopArt(null)}
                error={fileErrors.desktop}
                disabled={create.mutation.isPending}
              />

              <ArtworkPicker
                id="mobile-image"
                label="صورة الهاتف"
                spec={placement?.mobile}
                art={mobileArt}
                busy={Boolean(processing.mobile)}
                onPick={pickArtwork("mobile", "صورة الهاتف", placement?.mobile)}
                onRecrop={recropArtwork(
                  "mobile",
                  "صورة الهاتف",
                  placement?.mobile,
                  mobileArt
                )}
                onClear={() => setMobileArt(null)}
                error={fileErrors.mobile}
                disabled={create.mutation.isPending}
              />

              {placement?.imageUsageNote && (
                <p className="whitespace-pre-line rounded-xl bg-brand-50 px-3.5 py-3 text-[12px] leading-6 text-ink-soft">
                  {placement.imageUsageNote}
                </p>
              )}

              {/* The server checks the artwork against the placement's rules. */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!location || !desktopImage || !mobileImage}
                loading={preview.mutation.isPending}
                onClick={() =>
                  preview.submit({
                    location: Number(location),
                    desktopImage,
                    mobileImage,
                  })
                }
              >
                <ScanLine size={15} />
                فحص الصور
              </Button>

              {preview.mutation.isSuccess && preview.mutation.data?.data && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                  <p className="flex items-center gap-2 text-[13px] font-bold text-emerald-800">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    الصور مقبولة
                  </p>

                  {preview.mutation.data.data.usageNote && (
                    <p className="mt-1 text-[12px] leading-6 text-emerald-700">
                      {preview.mutation.data.data.usageNote}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Banner content */}
            <section className="space-y-5">
              <h2 className="text-[15px] font-bold text-ink">محتوى البانر</h2>

              <TextField formik={formik} name="title" label="عنوان البانر" />

              <TextAreaField
                formik={formik}
                name="description"
                label="الوصف (اختياري)"
                rows={3}
                maxLength={1000}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  formik={formik}
                  name="buttonText"
                  label="نص الزر"
                />

                <TextField
                  formik={formik}
                  name="targetUrl"
                  label="رابط الإعلان"
                  dir="ltr"
                  placeholder="https://example.com أو /category/1"
                />
              </div>
            </section>

            {/* Advertiser */}
            <section className="space-y-5">
              <h2 className="text-[15px] font-bold text-ink">بيانات المُعلن</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  formik={formik}
                  name="advertiserName"
                  label="اسم المُعلن"
                />

                <TextField
                  formik={formik}
                  name="phoneNumber"
                  label="رقم الهاتف"
                  dir="ltr"
                />

                <TextField
                  formik={formik}
                  name="whatsAppNumber"
                  label="رقم واتساب (اختياري)"
                  dir="ltr"
                />

                <TextField
                  formik={formik}
                  name="email"
                  label="البريد الإلكتروني (اختياري)"
                  dir="ltr"
                />
              </div>
            </section>

            {/* Payment */}
            <section className="space-y-4">
              <h2 className="text-[15px] font-bold text-ink">الدفع</h2>

              <div>
                <label htmlFor="paymentMethodId" className={labelClass}>
                  طريقة الدفع
                </label>

                <div className="relative">
                  <select
                    id="paymentMethodId"
                    value={paymentMethodId}
                    onChange={(event) => setPaymentMethodId(event.target.value)}
                    disabled={methodsQuery.isLoading}
                    className={selectClass()}
                  >
                    <option value="">
                      {methodsQuery.isLoading ? "جارٍ التحميل…" : "اختر الطريقة"}
                    </option>

                    {methods.map((entry) => (
                      <option key={entry.method?.id} value={entry.method?.id}>
                        {entry.method?.arabicName || entry.method?.name}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
                  />
                </div>
              </div>

              {selectedMethod && (
                <>
                  <PaymentMethodInfo method={selectedMethod.method} />

                  {selectedMethod.transferNote && (
                    <p className="rounded-xl bg-brand-50 px-3.5 py-3 text-[12px] leading-6 text-ink-soft">
                      {selectedMethod.transferNote}
                    </p>
                  )}
                </>
              )}

              {/* The price is the server's quote, never a local calculation. */}
              {quoteQuery.isLoading && (
                <Skeleton className="h-32 rounded-2xl" />
              )}

              {quoteQuery.isError && (
                <p
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-[12.5px] leading-6 text-red-700"
                >
                  {quoteStatus === 409
                    ? apiErrorText(quoteQuery.error, "لم تعد هذه المساحة متاحة.")
                    : "تعذّر حساب السعر لهذا الاختيار."}
                </p>
              )}

              {quote && (
                <div className="rounded-2xl border border-line bg-canvas p-4">
                  <dl className="divide-y divide-line">
                    <Row label="المساحة" value={quote.locationName} />
                    <Row label="القسم" value={quote.categoryName} />
                    <Row label="القسم الفرعي" value={quote.subCategoryName} />
                    <Row
                      label="رقم المساحة"
                      value={
                        quote.slotNumber != null ? String(quote.slotNumber) : null
                      }
                    />
                    <Row label="المدة" value={quote.durationDisplay} />
                    <Row
                      label="من"
                      value={quote.startDate ? formatDate(quote.startDate) : null}
                    />
                    <Row
                      label="إلى"
                      value={quote.endDate ? formatDate(quote.endDate) : null}
                    />
                    <Row label="طريقة الدفع" value={quote.paymentMethodName} />
                  </dl>

                  <p className="tnum mt-3 border-t border-line pt-3 text-xl font-extrabold text-ink">
                    {quote.priceDisplay ||
                      formatMoney(quote.price, quote.currency)}
                  </p>
                </div>
              )}

              <FilePicker
                id="payment-proof"
                label="إثبات التحويل"
                hint="صورة واضحة لإيصال التحويل."
                file={paymentProof}
                onPick={pickFile(setPaymentProof, "proof")}
                onClear={() => setPaymentProof(null)}
                error={fileErrors.proof}
                disabled={create.mutation.isPending}
              />
            </section>

            {/* Confirmation */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-canvas px-4 py-3.5">
              <span className="text-[13px] text-ink-soft">
                أقر بصحة البيانات وأوافق على شروط النشر.
              </span>

              <Switch
                checked={accepted}
                onChange={setAccepted}
                label="الإقرار بالشروط"
              />
            </div>

            {submitAttempted && !accepted && (
              <p role="alert" className={errorClass}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>يجب الموافقة على الشروط قبل الإرسال</span>
              </p>
            )}

            {submitAttempted && (!location || !slotNumber || !paymentMethodId) && (
              <p role="alert" className={errorClass}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>اختر المساحة ورقم المساحة وطريقة الدفع</span>
              </p>
            )}

            {create.mutation.isPending && typeof create.progress === "number" && (
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-valuenow={create.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="رفع الملفات"
              >
                <div
                  className="h-full rounded-full bg-brand-700 transition-[width] duration-200"
                  style={{ width: `${create.progress}%` }}
                />
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={create.mutation.isPending}
            >
              <Send size={17} className="rtl:-scale-x-100" />
              {create.mutation.isPending && typeof create.progress === "number"
                ? `جارٍ الإرسال ${create.progress}%`
                : "إرسال طلب الحجز"}
            </Button>
          </form>
        )}
      </div>

      {/* One cropper for both slots — `cropTarget` says which one it is
          serving. Mounted outside the form so its buttons can never be read as
          form controls. */}
      <BannerCropDialog
        open={Boolean(cropTarget)}
        label={cropTarget?.label ?? ""}
        spec={cropTarget?.spec}
        file={cropTarget?.file}
        busy={Boolean(cropTarget && processing[cropTarget.key])}
        onCancel={() => setCropTarget(null)}
        onReplace={() => {
          const input = document.getElementById(`${cropTarget?.key}-image`);

          setCropTarget(null);

          /* Cleared first: picking the same file again fires no `change`
             event unless the input's value is reset. */
          if (input) {
            input.value = "";

            input.click();
          }
        }}
        onConfirm={confirmCrop}
      />
    </>
  );
}
