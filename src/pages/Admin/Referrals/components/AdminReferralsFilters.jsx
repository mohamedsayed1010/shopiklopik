import { useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import Button from "../../../../components/ui/Button";
import {
  inputClass,
  labelClass,
  selectClass,
} from "../../../../components/ui/formStyles";
import useAdminReferralsContext from "../../../../hooks/admin/useAdminReferralsContext";
import { useAdminReferralStatuses } from "../../../../hooks/admin/useAdminReferrals";

function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>

      {children}

      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export default function AdminReferralsFilters() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
  } = useAdminReferralsContext();

  const { statuses, statusesQuery } = useAdminReferralStatuses();

  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو اسم المستخدم أو الكود"
            aria-label="بحث في الدعوات"
            className={`${inputClass()} ps-11`}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
        >
          <SlidersHorizontal size={17} />
          فلاتر متقدمة
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={resetFilters}>
            <X size={16} />
            مسح الفلاتر
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          <Field
            label="الحالة"
            htmlFor="referral-status-filter"
            hint={
              statusesQuery.isError
                ? "تعذّر تحميل قائمة الحالات."
                : undefined
            }
          >
            <div className="relative">
              <select
                id="referral-status-filter"
                value={filters.status}
                onChange={(event) => setFilter("status", event.target.value)}
                disabled={statusesQuery.isLoading}
                className={selectClass()}
              >
                <option value="">
                  {statusesQuery.isLoading ? "جارٍ التحميل…" : "كل الحالات"}
                </option>

                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
              />
            </div>
          </Field>

          <Field label="كود الدعوة" htmlFor="referral-code-filter">
            <input
              id="referral-code-filter"
              type="text"
              dir="ltr"
              value={filters.referralCode}
              onChange={(event) => setFilter("referralCode", event.target.value)}
              placeholder="ABC123"
              className={inputClass()}
            />
          </Field>

          <Field
            label="معرّف الداعي"
            htmlFor="referrer-id-filter"
            hint="معرّف حساب المستخدم صاحب الدعوة."
          >
            <input
              id="referrer-id-filter"
              type="text"
              dir="ltr"
              value={filters.referrerUserId}
              onChange={(event) =>
                setFilter("referrerUserId", event.target.value)
              }
              placeholder="User ID"
              className={inputClass()}
            />
          </Field>

          <Field
            label="معرّف المدعو"
            htmlFor="referred-id-filter"
            hint="معرّف حساب المستخدم الذي انضم عبر الدعوة."
          >
            <input
              id="referred-id-filter"
              type="text"
              dir="ltr"
              value={filters.referredUserId}
              onChange={(event) =>
                setFilter("referredUserId", event.target.value)
              }
              placeholder="User ID"
              className={inputClass()}
            />
          </Field>

          <Field label="من تاريخ" htmlFor="referral-from-filter">
            <input
              id="referral-from-filter"
              type="date"
              value={filters.fromDate}
              onChange={(event) => setFilter("fromDate", event.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field label="إلى تاريخ" htmlFor="referral-to-filter">
            <input
              id="referral-to-filter"
              type="date"
              value={filters.toDate}
              onChange={(event) => setFilter("toDate", event.target.value)}
              className={inputClass()}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
