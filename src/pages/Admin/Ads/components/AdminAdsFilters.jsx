import { useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import { inputClass, labelClass, selectClass } from "../../../../components/ui/formStyles";
import useAdminAdsContext from "../../../../hooks/admin/useAdminAdsContext";
import useAdminAdsMetadata from "../../../../hooks/admin/useAdminAdsMetadata";

/** One labelled select, so the eight filters below stay readable. */
function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, placeholder, options, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass()}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
      />
    </div>
  );
}

export default function AdminAdsFilters() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    activeTab,
  } = useAdminAdsContext();

  const { categories, subCategoriesOf, modulesOf, moderationStatuses } =
    useAdminAdsMetadata();

  const tabPinsStatus = "status" in activeTab.filters;

  const tabPinsModeration = "moderationStatus" in activeTab.filters;

  const subCategories = subCategoriesOf(filters.categoryId);

  const modules = modulesOf(filters.categoryId, filters.subCategoryId);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بعنوان الإعلان…"
            aria-label="بحث في الإعلانات"
            className={`${inputClass()} ps-11`}
          />
        </div>

        <Button
          type="button"
          variant={isOpen ? "primary" : "outline"}
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
        >
          <SlidersHorizontal size={16} />
          فلاتر متقدمة
        </Button>

        {hasActiveFilters && (
          <Button type="button" variant="ghost" onClick={resetFilters}>
            <X size={16} />
            مسح الفلاتر
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="القسم">
            <Select
              value={filters.categoryId}
              onChange={(value) => setFilter("categoryId", value)}
              placeholder="كل الأقسام"
              options={categories.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
            />
          </Field>

          <Field label="القسم الفرعي">
            <Select
              value={filters.subCategoryId}
              onChange={(value) => setFilter("subCategoryId", value)}
              placeholder="كل الأقسام الفرعية"
              options={subCategories.map((sub) => ({
                value: String(sub.id),
                label: sub.name,
              }))}
            />
          </Field>

          <Field label="نوع الإعلان">
            <Select
              value={filters.type}
              onChange={(value) => setFilter("type", value)}
              placeholder="كل الأنواع"
              options={modules.map((module) => ({
                value: String(module.id),
                label: module.arabicName || module.name,
              }))}
            />
          </Field>

          {!tabPinsModeration && (
            <Field label="حالة المراجعة">
              <Select
                value={filters.moderationStatus}
                onChange={(value) => setFilter("moderationStatus", value)}
                placeholder="كل حالات المراجعة"
                options={moderationStatuses.map((option) => ({
                  value: String(option.id),
                  label: option.name,
                }))}
              />
            </Field>
          )}

          {!tabPinsStatus && (
            <Field label="حالة الإعلان">
              <Select
                value={filters.status}
                onChange={(value) => setFilter("status", value)}
                placeholder="كل الحالات"
                /* Only the values confirmed against the live API — see
                   `adminAdsConstants`. The enum declares two more that no row
                   has ever matched, so they are not offered as if they worked. */
                options={[
                  { value: "0", label: "قيد المراجعة" },
                  { value: "1", label: "نشط" },
                  { value: "2", label: "منتهي" },
                ]}
              />
            </Field>
          )}

          <Field label="من تاريخ">
            <input
              type="date"
              value={filters.fromDate}
              max={filters.toDate || undefined}
              onChange={(event) => setFilter("fromDate", event.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field label="إلى تاريخ">
            <input
              type="date"
              value={filters.toDate}
              min={filters.fromDate || undefined}
              onChange={(event) => setFilter("toDate", event.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field label="معرّف المالك">
            <input
              type="text"
              value={filters.ownerId}
              onChange={(event) => setFilter("ownerId", event.target.value)}
              placeholder="Owner ID"
              dir="ltr"
              className={`${inputClass()} text-start`}
            />
          </Field>
        </div>
      )}
    </section>
  );
}
