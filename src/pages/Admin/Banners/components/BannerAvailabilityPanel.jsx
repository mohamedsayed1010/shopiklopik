import { useState } from "react";
import { CalendarCheck, ChevronDown, Search } from "lucide-react";

import Button from "../../../../components/ui/Button";
import Skeleton from "../../../../components/ui/Skeleton";
import ErrorState from "../../../../components/ui/ErrorState";
import { selectClass } from "../../../../components/ui/formStyles";
import { useAdminBannerAvailability } from "../../../../hooks/admin/useAdminBannerRequests";
import { useAdminBannerPrices } from "../../../../hooks/admin/useAdminBannerPrices";
import useCategoriesTree from "../../../../components/CreateAd/useCategoriesTree";
import { formatFormats } from "../../../../utils/bannerModel";
import { formatMoney, formatDate, formatNumber } from "../../../../utils/format";

function Spec({ label, value }) {
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

export default function BannerAvailabilityPanel() {
  const { placements, pricesQuery } = useAdminBannerPrices();

  const [location, setLocation] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [subCategoryId, setSubCategoryId] = useState("");

  const selectedPlacement = placements.find(
    (placement) => String(placement.location) === String(location)
  );

  const { categories, isLoading: categoriesLoading } = useCategoriesTree();

  const subCategories =
    categories.find((category) => String(category.id) === String(categoryId))
      ?.subCategories ?? [];

  const query = useAdminBannerAvailability({
    location: location === "" ? undefined : Number(location),
    categoryId: categoryId === "" ? undefined : Number(categoryId),
    subCategoryId: subCategoryId === "" ? undefined : Number(subCategoryId),
  });

  const data = query.data?.data ?? null;

  const placement = data?.placement;

  return (
    <section className="rounded-3xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink">
        <CalendarCheck
          size={17}
          strokeWidth={2}
          aria-hidden="true"
          className="text-brand-500"
        />
        توفّر المساحات
      </h3>

      <p className="mt-1 text-[12.5px] leading-6 text-muted">
        تحقّق من المساحات الشاغرة قبل الموافقة على طلب.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="availability-location"
            className="mb-1.5 block text-[12px] font-medium text-muted"
          >
            المساحة
          </label>

          <div className="relative">
            <select
              id="availability-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={pricesQuery.isLoading}
              className={`${selectClass()} h-11 text-sm`}
            >
              <option value="">
                {pricesQuery.isLoading ? "جارٍ التحميل…" : "اختر المساحة"}
              </option>

              {placements.map((item) => (
                <option key={item.location} value={item.location}>
                  {item.locationName}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="availability-category"
            className="mb-1.5 block text-[12px] font-medium text-muted"
          >
            القسم (اختياري)
          </label>

          <div className="relative">
            <select
              id="availability-category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);

                /* The chosen sub-category belongs to the old category, so it
                   cannot survive the change. */
                setSubCategoryId("");
              }}
              disabled={categoriesLoading}
              className={`${selectClass()} h-11 text-sm`}
            >
              <option value="">
                {categoriesLoading ? "جارٍ التحميل…" : "كل الأقسام"}
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameAr}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="availability-subcategory"
            className="mb-1.5 block text-[12px] font-medium text-muted"
          >
            القسم الفرعي
            {selectedPlacement?.requiresSubCategory ? "" : " (اختياري)"}
          </label>

          <div className="relative">
            <select
              id="availability-subcategory"
              value={subCategoryId}
              onChange={(event) => setSubCategoryId(event.target.value)}
              disabled={categoriesLoading || categoryId === ""}
              className={`${selectClass()} h-11 text-sm`}
            >
              <option value="">
                {categoryId === ""
                  ? "اختر القسم أولًا"
                  : "كل الأقسام الفرعية"}
              </option>

              {subCategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>
                  {subCategory.nameAr}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
            />
          </div>
        </div>
      </div>

      {selectedPlacement?.requiresSubCategory && subCategoryId === "" && (
        <p className="mt-3 rounded-xl bg-gold-50 px-3.5 py-2.5 text-[12px] leading-6 text-gold-700">
          هذه المساحة تتطلّب تحديد قسم فرعي للحصول على نتيجة دقيقة.
        </p>
      )}

      <div className="mt-5">
        {location === "" ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-canvas px-4 py-8 text-center text-[13px] text-muted">
            اختر مساحة لعرض التوفّر.
          </p>
        ) : query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : query.isError ? (
          <ErrorState
            title="تعذّر جلب التوفّر"
            description="حدث خطأ أثناء الاستعلام عن المساحات. حاول مرة أخرى."
            onRetry={query.refetch}
          />
        ) : !data ? null : (
          <div className="space-y-4">
            {/* Verdict */}
            <div
              className={`rounded-2xl border px-4 py-3.5 ${
                data.isAvailable
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-gold-300 bg-gold-50"
              }`}
            >
              <p
                className={`text-[13px] font-bold ${
                  data.isAvailable ? "text-emerald-800" : "text-gold-800"
                }`}
              >
                {data.locationName}
              </p>

              {data.message && (
                <p
                  className={`mt-1 text-[12.5px] leading-6 ${
                    data.isAvailable ? "text-emerald-700" : "text-gold-700"
                  }`}
                >
                  {data.message}
                </p>
              )}

              <p className="tnum mt-1.5 text-[12px] text-ink-soft">
                {formatNumber((data.availableSlots ?? []).length)} مساحة متاحة من{" "}
                {formatNumber((data.slots ?? []).length)}
              </p>

              {(data.nextStartDate || data.nextEndDate) && (
                <p className="tnum mt-1 text-[11.5px] text-ink-soft">
                  الفترة القادمة:{" "}
                  {data.nextStartDate ? formatDate(data.nextStartDate) : "—"} ←{" "}
                  {data.nextEndDate ? formatDate(data.nextEndDate) : "—"}
                </p>
              )}
            </div>

            {/* Slots */}
            {(data.slots ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line-strong bg-canvas px-4 py-8 text-center text-[13px] text-muted">
                لا توجد مساحات معرّفة لهذا الموقع.
              </p>
            ) : (
              <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {data.slots.map((slot) => (
                  <li
                    key={slot.slotNumber}
                    className={`rounded-xl border px-3.5 py-3 ${
                      slot.isAvailable
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-line bg-canvas"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[12.5px] font-bold text-ink">
                        {slot.slotName || `#${slot.slotNumber}`}
                      </span>

                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${
                          slot.isAvailable
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-gold-50 text-gold-700 ring-gold-200"
                        }`}
                      >
                        {slot.statusName ||
                          (slot.isAvailable ? "متاح" : "محجوز")}
                      </span>
                    </div>

                    {slot.availableFrom && (
                      <p className="tnum mt-1.5 text-[11.5px] text-muted">
                        متاح من {formatDate(slot.availableFrom)}
                      </p>
                    )}

                    {slot.reservedUntil && (
                      <p className="tnum mt-0.5 text-[11.5px] text-muted">
                        محجوز حتى {formatDate(slot.reservedUntil)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Placement specs, as the endpoint reports them */}
            {placement && (
              <div className="rounded-2xl border border-line bg-canvas p-4">
                <p className="mb-2 text-[12.5px] font-bold text-ink">
                  مواصفات المساحة
                </p>

                <dl className="divide-y divide-line">
                  <Spec
                    label="السعر"
                    value={
                      placement.priceDisplay ||
                      formatMoney(placement.price, placement.currency)
                    }
                  />
                  <Spec label="المدة" value={placement.durationDisplay} />
                  <Spec
                    label="أقصى عدد مساحات"
                    value={
                      placement.maxSlots != null
                        ? formatNumber(placement.maxSlots)
                        : null
                    }
                  />
                  <Spec
                    label="يتطلّب قسمًا فرعيًا"
                    value={placement.requiresSubCategory ? "نعم" : "لا"}
                  />
                  <Spec
                    label="الحالة"
                    value={placement.isActive ? "مفعّلة" : "معطّلة"}
                  />
                  <Spec
                    label="مقاس سطح المكتب"
                    value={placement.desktop?.resolution}
                  />
                  <Spec label="مقاس الهاتف" value={placement.mobile?.resolution} />
                  <Spec
                    label="الصيغ المسموحة"
                    value={formatFormats(placement.desktop)}
                  />
                  <Spec
                    label="أقصى حجم للصورة"
                    value={
                      placement.desktop?.maxSizeMegabytes
                        ? `${placement.desktop.maxSizeMegabytes} ميجابايت`
                        : null
                    }
                  />
                </dl>

                {placement.imageUsageNote && (
                  <p className="mt-3 whitespace-pre-line rounded-xl bg-brand-50 px-3.5 py-3 text-[12px] leading-6 text-ink-soft">
                    {placement.imageUsageNote}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {location !== "" && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            loading={query.isFetching && !query.isLoading}
          >
            <Search size={15} />
            إعادة الفحص
          </Button>
        </div>
      )}
    </section>
  );
}
