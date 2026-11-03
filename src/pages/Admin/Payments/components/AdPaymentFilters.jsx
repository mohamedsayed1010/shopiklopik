import { ChevronDown, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import { errorClass, inputClass, selectClass } from "../../../../components/ui/formStyles";

function Field({ label, htmlFor, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-medium text-muted">
        {label}
      </label>

      {children}

      {error && (
        <p id={`${htmlFor}-error`} className={errorClass}>
          {error}
        </p>
      )}
    </div>
  );
}

function Select({ id, value, onChange, disabled, placeholder, options }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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

/* Every documented filter of `GET /submissions` and `GET /history` except
   `IsPageIndexOutOfRange`, whose meaning the server does not reveal (see
   utils/adPayment.js). Values are restricted to the documented ones. */
export default function AdPaymentFilters({
  idPrefix,
  filters,
  setFilter,
  resetFilters,
  hasActiveFilters,
  statusOptions,
  typeOptions,
  categoryOptions,
  metadataLoading,
  dateError,
  advertisementIdError,
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="حالة الدفع" htmlFor={`${idPrefix}-status`}>
          <Select
            id={`${idPrefix}-status`}
            value={filters.status}
            onChange={(value) => setFilter("status", value)}
            placeholder="كل الحالات"
            options={statusOptions}
          />
        </Field>

        <Field label="نوع الإعلان" htmlFor={`${idPrefix}-type`}>
          <Select
            id={`${idPrefix}-type`}
            value={filters.type}
            onChange={(value) => setFilter("type", value)}
            disabled={metadataLoading}
            placeholder={metadataLoading ? "جارٍ التحميل…" : "كل الأنواع"}
            options={typeOptions}
          />
        </Field>

        <Field label="القسم" htmlFor={`${idPrefix}-category`}>
          <Select
            id={`${idPrefix}-category`}
            value={filters.categoryId}
            onChange={(value) => setFilter("categoryId", value)}
            disabled={metadataLoading}
            placeholder={metadataLoading ? "جارٍ التحميل…" : "كل الأقسام"}
            options={categoryOptions}
          />
        </Field>

        <Field label="معرّف المستخدم" htmlFor={`${idPrefix}-user`}>
          <input
            id={`${idPrefix}-user`}
            type="text"
            dir="ltr"
            value={filters.userId}
            onChange={(event) => setFilter("userId", event.target.value)}
            placeholder="User ID"
            autoComplete="off"
            spellCheck={false}
            className={`${inputClass()} h-11 text-sm`}
          />
        </Field>

        <Field
          label="معرّف الإعلان"
          htmlFor={`${idPrefix}-ad`}
          error={advertisementIdError}
        >
          <input
            id={`${idPrefix}-ad`}
            type="text"
            dir="ltr"
            value={filters.advertisementId}
            onChange={(event) => setFilter("advertisementId", event.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(advertisementIdError) || undefined}
            aria-describedby={advertisementIdError ? `${idPrefix}-ad-error` : undefined}
            className={`${inputClass({ invalid: Boolean(advertisementIdError) })} h-11 text-sm`}
          />
        </Field>

        <Field label="من تاريخ" htmlFor={`${idPrefix}-from`} error={dateError}>
          <input
            id={`${idPrefix}-from`}
            type="date"
            value={filters.fromDate}
            max={filters.toDate || undefined}
            onChange={(event) => setFilter("fromDate", event.target.value)}
            aria-invalid={Boolean(dateError) || undefined}
            className={`${inputClass({ invalid: Boolean(dateError) })} h-11 text-sm`}
          />
        </Field>

        <Field label="إلى تاريخ" htmlFor={`${idPrefix}-to`}>
          <input
            id={`${idPrefix}-to`}
            type="date"
            value={filters.toDate}
            min={filters.fromDate || undefined}
            onChange={(event) => setFilter("toDate", event.target.value)}
            aria-invalid={Boolean(dateError) || undefined}
            className={`${inputClass({ invalid: Boolean(dateError) })} h-11 text-sm`}
          />
        </Field>

        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="h-11 w-full"
          >
            <X size={15} />
            مسح الفلاتر
          </Button>
        </div>
      </div>
    </div>
  );
}
