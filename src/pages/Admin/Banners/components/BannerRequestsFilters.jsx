import { ChevronDown, Search, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import { inputClass, selectClass } from "../../../../components/ui/formStyles";
import useAdminBannersContext from "../../../../hooks/admin/useAdminBannersContext";
import { useAdminBannerPrices } from "../../../../hooks/admin/useAdminBannerPrices";
import useCategoriesTree from "../../../../components/CreateAd/useCategoriesTree";
import {
  bannerStatusLabel,
  bannerStatusParam,
  optionsFromRows,
} from "../../../../utils/bannerModel";

function Field({ label, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[12px] font-medium text-muted"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function Select({ id, value, onChange, disabled, placeholder, options }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${selectClass()} h-11 text-sm`}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
      />
    </div>
  );
}

export default function BannerRequestsFilters({ rows }) {
  const {
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    statuses,
    statusesQuery,
    statusFilter,
  } = useAdminBannersContext();

  const { placements, pricesQuery } = useAdminBannerPrices();

  const locationOptions = placements.map((placement) => ({
    id: placement.location,
    name: placement.locationName,
  }));

  const { categories, isLoading: categoriesLoading } = useCategoriesTree();

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.nameAr,
  }));

  /* Sub-categories belong to the chosen category, so the second select is fed
     from that branch of the tree and is empty until one is picked. */
  const subCategoryOptions = (
    categories.find(
      (category) => String(category.id) === String(filters.categoryId)
    )?.subCategories ?? []
  ).map((subCategory) => ({ id: subCategory.id, name: subCategory.nameAr }));

  const statusOptions = statuses.map((status) => ({
    id: bannerStatusParam(status),
    name: bannerStatusLabel(status),
  }));

  const paymentOptions = optionsFromRows(
    rows,
    "paymentStatus",
    "paymentStatusName",
    filters.paymentStatus === ""
      ? undefined
      : { id: Number(filters.paymentStatus), name: `#${filters.paymentStatus}` }
  );

  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="relative">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
        />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث بعنوان البانر أو اسم المُعلن…"
          aria-label="بحث في طلبات البانرات"
          className={`${inputClass()} ps-11`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="حالة الطلب" htmlFor="banners-status">
          <Select
            id="banners-status"
            /* The canonical spelling, so a link that arrived as `?status=3` or
               in Arabic still lands on the right option. An unresolved value
               shows nothing here — the list reports it instead. */
            value={
              statusFilter.status ? bannerStatusParam(statusFilter.status) : ""
            }
            onChange={(event) => setFilter("status", event.target.value)}
            disabled={statusesQuery.isLoading}
            placeholder={
              statusesQuery.isLoading
                ? "جارٍ التحميل…"
                : statusOptions.length
                ? "كل الحالات"
                : "تعذّر تحميل الحالات"
            }
            options={statusOptions}
          />
        </Field>

        <Field label="حالة الدفع" htmlFor="banners-payment">
          <Select
            id="banners-payment"
            value={filters.paymentStatus}
            onChange={(event) => setFilter("paymentStatus", event.target.value)}
            placeholder={
              paymentOptions.length ? "كل حالات الدفع" : "لا توجد حالات معروفة"
            }
            options={paymentOptions}
          />
        </Field>

        <Field label="المساحة" htmlFor="banners-location">
          <Select
            id="banners-location"
            value={filters.location}
            onChange={(event) => setFilter("location", event.target.value)}
            disabled={pricesQuery.isLoading}
            placeholder={
              pricesQuery.isLoading ? "جارٍ التحميل…" : "كل المساحات"
            }
            options={locationOptions}
          />
        </Field>

        <Field label="القسم (اختياري)" htmlFor="banners-category">
          <Select
            id="banners-category"
            value={filters.categoryId}
            onChange={(event) => setFilter("categoryId", event.target.value)}
            disabled={categoriesLoading}
            placeholder={
              categoriesLoading ? "جارٍ التحميل…" : "كل الأقسام"
            }
            options={categoryOptions}
          />
        </Field>

        <Field label="القسم الفرعي (اختياري)" htmlFor="banners-subcategory">
          <Select
            id="banners-subcategory"
            value={filters.subCategoryId}
            onChange={(event) => setFilter("subCategoryId", event.target.value)}
            disabled={categoriesLoading || filters.categoryId === ""}
            placeholder={
              filters.categoryId === ""
                ? "اختر القسم أولًا"
                : "كل الأقسام الفرعية"
            }
            options={subCategoryOptions}
          />
        </Field>

        <Field label="من تاريخ" htmlFor="banners-from">
          <input
            id="banners-from"
            type="date"
            value={filters.fromDate}
            max={filters.toDate || undefined}
            onChange={(event) => setFilter("fromDate", event.target.value)}
            className={`${inputClass()} h-11 text-sm`}
          />
        </Field>

        <Field label="إلى تاريخ" htmlFor="banners-to">
          <input
            id="banners-to"
            type="date"
            value={filters.toDate}
            min={filters.fromDate || undefined}
            onChange={(event) => setFilter("toDate", event.target.value)}
            className={`${inputClass()} h-11 text-sm`}
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          <X size={15} />
          مسح الفلاتر
        </Button>
      </div>
    </div>
  );
}
