import { useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import {
  inputClass,
  labelClass,
  selectClass,
} from "../../../../components/ui/formStyles";
import useAdminAuditLogsContext from "../../../../hooks/admin/useAdminAuditLogsContext";
import useAdminAuditMetadata from "../../../../hooks/admin/useAdminAuditMetadata";
import { AUDIT_SORT_OPTIONS } from "../auditLogsConstants";
import { formatNumber } from "../../../../utils/format";

function Field({ label, htmlFor, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({ id, value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
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

export default function AdminAuditFilters() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    sort,
    setSort,
  } = useAdminAuditLogsContext();

  const { actions, targetTypes, admins } = useAdminAuditMetadata();

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
            placeholder="ابحث في الوصف…"
            aria-label="بحث في سجل العمليات"
            className={`${inputClass()} ps-11`}
          />
        </div>

        <div className="relative w-full sm:w-52">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="ترتيب النتائج"
            className={selectClass()}
          >
            {AUDIT_SORT_OPTIONS.map((option) => (
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

        <div className="flex gap-2">
          <Button
            type="button"
            variant={isOpen ? "primary" : "outline"}
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            className="flex-1 sm:flex-none"
          >
            <SlidersHorizontal size={16} />
            فلاتر متقدمة
          </Button>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" onClick={resetFilters}>
              <X size={16} />
              مسح
            </Button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="المسؤول" htmlFor="audit-admin">
            <Select
              id="audit-admin"
              value={filters.adminUserId}
              onChange={(value) => setFilter("adminUserId", value)}
              placeholder="كل المسؤولين"
              options={admins.map((admin) => ({
                value: admin.adminUserId,
                // The count is the server's own tally per administrator.
                label: `${admin.adminName} (${formatNumber(admin.count)})`,
              }))}
            />
          </Field>

          <Field label="نوع العملية" htmlFor="audit-action">
            <Select
              id="audit-action"
              value={filters.action}
              onChange={(value) => setFilter("action", value)}
              placeholder="كل العمليات"
              options={actions.map((action) => ({
                value: String(action.id),
                label: action.name,
              }))}
            />
          </Field>

          <Field label="نوع العنصر" htmlFor="audit-target-type">
            <Select
              id="audit-target-type"
              value={filters.targetType}
              onChange={(value) => setFilter("targetType", value)}
              placeholder="كل العناصر"
              options={targetTypes.map((type) => ({
                value: type.value,
                label: type.name,
              }))}
            />
          </Field>

          <Field label="من تاريخ" htmlFor="audit-date-from">
            <input
              id="audit-date-from"
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(event) => setFilter("dateFrom", event.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field label="إلى تاريخ" htmlFor="audit-date-to">
            <input
              id="audit-date-to"
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(event) => setFilter("dateTo", event.target.value)}
              className={inputClass()}
            />
          </Field>
        </div>
      )}
    </section>
  );
}
