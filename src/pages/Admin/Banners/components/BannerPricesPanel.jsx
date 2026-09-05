import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AlertCircle, Layers, Pencil, RotateCw } from "lucide-react";

import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";
import Skeleton from "../../../../components/ui/Skeleton";
import ErrorState from "../../../../components/ui/ErrorState";
import Switch from "../../../../components/ui/Switch";
import { errorClass, inputClass, labelClass } from "../../../../components/ui/formStyles";
import {
  useAdminBannerPrices,
  useUpdateBannerPrice,
} from "../../../../hooks/admin/useAdminBannerPrices";
import { toPlacementForm } from "../../../../api/admin/banners/bannerPricesEndpoints";
import { formatFormats } from "../../../../utils/bannerModel";
import { formatMoney, formatNumber } from "../../../../utils/format";

const validationSchema = Yup.object({
  price: Yup.number()
    .typeError("أدخل رقمًا")
    .min(0, "لا يقل عن صفر")
    .required("السعر مطلوب"),

  durationDays: Yup.number()
    .typeError("أدخل رقمًا")
    .integer("عدد صحيح فقط")
    .min(1, "يوم واحد على الأقل")
    .required("المدة مطلوبة"),

  maxSlots: Yup.number()
    .typeError("أدخل رقمًا")
    .integer("عدد صحيح فقط")
    .min(1, "مساحة واحدة على الأقل")
    .required("العدد مطلوب"),

  desktopWidth: Yup.number()
    .typeError("أدخل رقمًا")
    .integer("عدد صحيح فقط")
    .min(1, "أكبر من صفر")
    .required("مطلوب"),

  desktopHeight: Yup.number()
    .typeError("أدخل رقمًا")
    .integer("عدد صحيح فقط")
    .min(1, "أكبر من صفر")
    .required("مطلوب"),

  mobileWidth: Yup.number()
    .typeError("أدخل رقمًا")
    .integer("عدد صحيح فقط")
    .min(1, "أكبر من صفر")
    .required("مطلوب"),

  mobileHeight: Yup.number()
    .typeError("أدخل رقمًا")
    .integer("عدد صحيح فقط")
    .min(1, "أكبر من صفر")
    .required("مطلوب"),

  maxImageSizeMegabytes: Yup.number()
    .typeError("أدخل رقمًا")
    .integer("عدد صحيح فقط")
    .min(1, "ميجابايت واحد على الأقل")
    .required("مطلوب"),

  allowedFormats: Yup.string()
    .trim()
    .required("حدّد صيغة واحدة على الأقل")
    .test(
      "has-format",
      "حدّد صيغة واحدة على الأقل",
      (value) =>
        String(value ?? "")
          .split(/[,،\s]+/)
          .filter(Boolean).length > 0
    ),

  displayOrder: Yup.number()
    .typeError("أدخل رقمًا")
    .integer("عدد صحيح فقط")
    .min(0, "لا يقل عن صفر")
    .required("مطلوب"),
});

/** A labelled number input bound to Formik. */
function NumberField({ formik, name, label, hint, min = 0 }) {
  const invalid = Boolean(formik.touched[name] && formik.errors[name]);

  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="number"
        min={min}
        dir="ltr"
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        aria-invalid={invalid}
        className={`${inputClass({ invalid })} tnum`}
      />

      {invalid ? (
        <p role="alert" className={errorClass}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{formik.errors[name]}</span>
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p>
      )}
    </div>
  );
}

function EditPlacementModal({ open, placement, onClose }) {
  const { mutation, submit } = useUpdateBannerPrice({ onDone: onClose });

  const formik = useFormik({
    initialValues: toPlacementForm(placement),
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (mutation.isPending) return;

      /* `previous` is read only to word the success toast — see
         `placementUpdateMessage`. The request body is built from `values`
         alone, so this rides along without changing what is sent. */
      submit({
        location: placement.location,
        values,
        previous: toPlacementForm(placement),
      });
    },
  });

  const formatsInvalid = Boolean(
    formik.touched.allowedFormats && formik.errors.allowedFormats
  );

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="تعديل المساحة"
      description={placement?.locationName}
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={mutation.isPending}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            fullWidth
            loading={mutation.isPending}
            onClick={formik.handleSubmit}
          >
            حفظ
          </Button>
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            formik={formik}
            name="price"
            label={`السعر (${placement?.currency || "EGP"})`}
          />

          <NumberField
            formik={formik}
            name="durationDays"
            label="مدة الحجز (بالأيام)"
            hint="عدد أيام الحجز الواحد لهذه المساحة."
            min={1}
          />

          <NumberField
            formik={formik}
            name="maxSlots"
            label="أقصى عدد مساحات"
            min={1}
          />
        </div>

        <div className="rounded-2xl border border-line bg-canvas p-4">
          <p className="mb-4 text-[13px] font-bold text-ink">مقاس سطح المكتب</p>

          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              formik={formik}
              name="desktopWidth"
              label="العرض (بكسل)"
              min={1}
            />

            <NumberField
              formik={formik}
              name="desktopHeight"
              label="الارتفاع (بكسل)"
              min={1}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-canvas p-4">
          <p className="mb-4 text-[13px] font-bold text-ink">مقاس الهاتف</p>

          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              formik={formik}
              name="mobileWidth"
              label="العرض (بكسل)"
              min={1}
            />

            <NumberField
              formik={formik}
              name="mobileHeight"
              label="الارتفاع (بكسل)"
              min={1}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            formik={formik}
            name="maxImageSizeMegabytes"
            label="أقصى حجم للصورة (ميجابايت)"
            min={1}
          />

          <NumberField formik={formik} name="displayOrder" label="ترتيب العرض" />
        </div>

        <div>
          <label htmlFor="allowedFormats" className={labelClass}>
            الصيغ المسموحة
          </label>

          <input
            id="allowedFormats"
            name="allowedFormats"
            type="text"
            dir="ltr"
            value={formik.values.allowedFormats}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={formatsInvalid}
            placeholder="jpg, png, webp"
            className={inputClass({ invalid: formatsInvalid })}
          />

          {formatsInvalid ? (
            <p role="alert" className={errorClass}>
              <AlertCircle
                size={13}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>{formik.errors.allowedFormats}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-xs leading-5 text-muted">
              افصل بين الصيغ بفاصلة. تُرسل كقائمة إلى الخادم.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-canvas px-4 py-3">
          <span className="text-sm font-medium text-ink">
            {formik.values.isActive ? "المساحة مفعّلة" : "المساحة معطّلة"}
          </span>

          <Switch
            checked={Boolean(formik.values.isActive)}
            onChange={(next) => formik.setFieldValue("isActive", next)}
            label="تفعيل المساحة"
          />
        </div>
      </form>
    </Modal>
  );
}

function SpecRow({ label, value }) {
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

export default function BannerPricesPanel() {
  const { pricesQuery, placements } = useAdminBannerPrices();

  const [editing, setEditing] = useState(null);

  const status = pricesQuery.error?.response?.status;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink">
            <Layers
              size={17}
              strokeWidth={2}
              aria-hidden="true"
              className="text-brand-500"
            />
            الأسعار والمساحات
          </h3>

          <p className="mt-1 text-[12.5px] text-muted">
            إعدادات كل مساحة إعلانية كما يقرأها المُعلنون.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => pricesQuery.refetch()}
          loading={pricesQuery.isFetching && !pricesQuery.isLoading}
        >
          <RotateCw size={15} />
          تحديث
        </Button>
      </div>

      {pricesQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : pricesQuery.isError ? (
        <ErrorState
          title={
            status === 429 ? "عدد كبير من الطلبات" : "تعذّر تحميل إعدادات المساحات"
          }
          description={
            status === 429
              ? "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة."
              : "حدث خطأ أثناء جلب الإعدادات. حاول مرة أخرى."
          }
          onRetry={pricesQuery.refetch}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {placements.map((placement) => (
            <div
              key={placement.location}
              className="rounded-2xl border border-line bg-surface p-4 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="min-w-0 text-[14px] font-bold text-ink">
                  {placement.locationName}
                </h4>

                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                    placement.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-100 text-slate-600 ring-slate-300"
                  }`}
                >
                  {placement.isActive ? "مفعّلة" : "معطّلة"}
                </span>
              </div>

              <p className="tnum mt-2 text-xl font-extrabold text-ink">
                {placement.priceDisplay ||
                  formatMoney(placement.price, placement.currency)}
              </p>

              <dl className="mt-3 divide-y divide-line border-t border-line pt-1">
                <SpecRow label="المدة" value={placement.durationDisplay} />
                <SpecRow
                  label="أقصى عدد مساحات"
                  value={
                    placement.maxSlots != null
                      ? formatNumber(placement.maxSlots)
                      : null
                  }
                />
                <SpecRow
                  label="يتطلّب قسمًا فرعيًا"
                  value={placement.requiresSubCategory ? "نعم" : "لا"}
                />
                <SpecRow
                  label="ترتيب العرض"
                  value={
                    placement.displayOrder != null
                      ? formatNumber(placement.displayOrder)
                      : null
                  }
                />
                <SpecRow
                  label="مقاس سطح المكتب"
                  value={placement.desktop?.resolution}
                />
                <SpecRow
                  label="مقاس الهاتف"
                  value={placement.mobile?.resolution}
                />
                <SpecRow
                  label="نسبة الأبعاد"
                  value={placement.desktop?.aspectRatio}
                />
                <SpecRow
                  label="الصيغ المسموحة"
                  value={formatFormats(placement.desktop)}
                />
                <SpecRow
                  label="أقصى حجم للصورة"
                  value={
                    placement.desktop?.maxSizeMegabytes
                      ? `${placement.desktop.maxSizeMegabytes} ميجابايت`
                      : null
                  }
                />
              </dl>

              {placement.imageUsageNote && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-brand-50 px-3 py-2.5 text-[11.5px] leading-6 text-ink-soft">
                  {placement.imageUsageNote}
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="mt-4"
                onClick={() => setEditing(placement)}
              >
                <Pencil size={15} />
                تعديل
              </Button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditPlacementModal
          open={Boolean(editing)}
          placement={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
