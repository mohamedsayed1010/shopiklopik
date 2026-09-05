import { ADMIN_ADS_TABS } from "../adminAdsConstants";
import { formatNumber } from "../../../../utils/format";

export default function AdminAdsTabs({ activeKey, onChange, pendingCount }) {
  return (
    <div
      role="tablist"
      aria-label="تصفية الإعلانات حسب الحالة"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      {ADMIN_ADS_TABS.map((tab) => {
        const Icon = tab.icon;

        const isActive = tab.key === activeKey;

        const badge =
          tab.showsPendingBadge && typeof pendingCount === "number" && pendingCount > 0
            ? pendingCount
            : null;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13.5px] font-semibold transition-[background-color,border-color,color] duration-200 ${
              isActive
                ? "border-brand-900 bg-brand-900 text-white shadow-xs"
                : "border-line bg-surface text-ink-soft hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900"
            }`}
          >
            <Icon size={16} strokeWidth={2} aria-hidden="true" />

            {tab.label}

            {badge !== null && (
              <span
                className={`tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  isActive ? "bg-white text-brand-900" : "bg-red-500 text-white"
                }`}
              >
                {badge > 99 ? "99+" : formatNumber(badge)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
