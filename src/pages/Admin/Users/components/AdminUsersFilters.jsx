import { useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import {
  inputClass,
  labelClass,
  selectClass,
} from "../../../../components/ui/formStyles";
import useAdminUsersContext from "../../../../hooks/admin/useAdminUsersContext";
import { useAdminUserStatuses } from "../../../../hooks/admin/useAdminUsers";

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

export default function AdminUsersFilters() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
  } = useAdminUsersContext();

  const { statuses } = useAdminUserStatuses();

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            placeholder="ابحث بالاسم أو البريد أو الهاتف…"
            aria-label="بحث في المستخدمين"
            className={`${inputClass()} ps-11`}
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
        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="حالة الحساب" htmlFor="users-status">
            <Select
              id="users-status"
              value={filters.status}
              onChange={(value) => setFilter("status", value)}
              placeholder="كل الحالات"
              options={statuses.map((status) => ({
                value: String(status.id),
                label: status.name,
              }))}
            />
          </Field>

          <Field label="نوع الحساب" htmlFor="users-is-admin">
            <Select
              id="users-is-admin"
              value={filters.isAdmin}
              onChange={(value) => setFilter("isAdmin", value)}
              placeholder="الكل"
              options={[
                { value: "true", label: "مسؤولون" },
                { value: "false", label: "مستخدمون عاديون" },
              ]}
            />
          </Field>

          <Field label="مسجّل من" htmlFor="users-from">
            <input
              id="users-from"
              type="date"
              value={filters.fromDate}
              max={filters.toDate || undefined}
              onChange={(event) => setFilter("fromDate", event.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field label="مسجّل إلى" htmlFor="users-to">
            <input
              id="users-to"
              type="date"
              value={filters.toDate}
              min={filters.fromDate || undefined}
              onChange={(event) => setFilter("toDate", event.target.value)}
              className={inputClass()}
            />
          </Field>
        </div>
      )}
    </section>
  );
}
