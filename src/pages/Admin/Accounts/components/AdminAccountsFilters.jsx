import { ChevronDown, Search, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import {
  inputClass,
  labelClass,
  selectClass,
} from "../../../../components/ui/formStyles";
import useAdminAccountsContext from "../../../../hooks/admin/useAdminAccountsContext";

const ACTIVITY_OPTIONS = [
  { value: "true", label: "المفعّلة فقط" },
  { value: "false", label: "المعطّلة فقط" },
];

export default function AdminAccountsFilters() {
  const {
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
  } = useAdminAccountsContext();

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="admin-accounts-search" className={labelClass}>
            بحث
          </label>

          <div className="relative">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
            />

            <input
              id="admin-accounts-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="الاسم، اسم المستخدم، البريد أو الهاتف…"
              className={`${inputClass()} ps-11`}
            />
          </div>
        </div>

        <div className="min-w-0 basis-48">
          <label htmlFor="admin-accounts-active" className={labelClass}>
            الحالة
          </label>

          <div className="relative">
            <select
              id="admin-accounts-active"
              value={filters.isActive}
              onChange={(event) => setFilter("isActive", event.target.value)}
              className={selectClass()}
            >
              <option value="">كل الحسابات</option>

              {ACTIVITY_OPTIONS.map((option) => (
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
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X size={15} />
            مسح الفلاتر
          </Button>
        )}
      </div>
    </div>
  );
}
