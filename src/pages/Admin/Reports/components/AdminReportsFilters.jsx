import { ChevronDown, Filter, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import Skeleton from "../../../../components/ui/Skeleton";
import { labelClass, selectClass } from "../../../../components/ui/formStyles";
import useAdminReportsContext from "../../../../hooks/admin/useAdminReportsContext";
import { useAdminReportsMetadata } from "../../../../hooks/admin/useAdminReports";
import useAdminAdsMetadata from "../../../../hooks/admin/useAdminAdsMetadata";

function Select({ id, label, value, onChange, placeholder, options, isLoading }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      {isLoading ? (
        <Skeleton className="h-12 w-full rounded-xl" />
      ) : (
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
      )}
    </div>
  );
}

export default function AdminReportsFilters() {
  const { filters, setFilter, resetFilters, hasActiveFilters } =
    useAdminReportsContext();

  const { statuses, reasons, metadataQuery } = useAdminReportsMetadata();

  const { modules, metadataQuery: adsMetadataQuery } = useAdminAdsMetadata();

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
          <Filter size={16} strokeWidth={2.1} aria-hidden="true" className="text-brand-500" />
          تصفية البلاغات
        </h2>

        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            <X size={15} />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          id="reports-status"
          label="حالة البلاغ"
          value={filters.status}
          onChange={(value) => setFilter("status", value)}
          placeholder="كل الحالات"
          isLoading={metadataQuery.isLoading}
          options={statuses.map((status) => ({
            value: String(status.id),
            label: status.name,
          }))}
        />

        <Select
          id="reports-reason"
          label="سبب البلاغ"
          value={filters.reason}
          onChange={(value) => setFilter("reason", value)}
          placeholder="كل الأسباب"
          isLoading={metadataQuery.isLoading}
          options={reasons.map((reason) => ({
            value: String(reason.id),
            label: reason.name,
          }))}
        />

        <Select
          id="reports-type"
          label="نوع الإعلان"
          value={filters.type}
          onChange={(value) => setFilter("type", value)}
          placeholder="كل الأنواع"
          isLoading={adsMetadataQuery.isLoading}
          options={modules.map((module) => ({
            value: String(module.id),
            label: module.arabicName || module.name,
          }))}
        />
      </div>
    </section>
  );
}
