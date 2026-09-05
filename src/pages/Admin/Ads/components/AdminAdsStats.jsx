import {
  Ban,
  CheckCircle2,
  Clock,
  LayoutList,
  TimerOff,
  XCircle,
} from "lucide-react";

import Skeleton from "../../../../components/ui/Skeleton";
import { formatNumber } from "../../../../utils/format";

const ICONS = {
  total: LayoutList,
  pending: Clock,
  active: CheckCircle2,
  rejected: XCircle,
  suspended: Ban,
  expired: TimerOff,
};

const TONES = {
  total: "text-brand-600 bg-brand-50",
  pending: "text-gold-700 bg-gold-50",
  active: "text-emerald-600 bg-emerald-50",
  rejected: "text-red-600 bg-red-50",
  suspended: "text-orange-600 bg-orange-50",
  expired: "text-slate-500 bg-slate-100",
};

/** A stat card maps onto the tab that shows the same filter. */
const CARD_TAB = {
  total: "all",
  pending: "pending",
  active: "active",
  rejected: "rejected",
  suspended: "suspended",
  expired: "expired",
};

export default function AdminAdsStats({ cards, activeTabKey, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = ICONS[card.key] ?? LayoutList;

        const tabKey = CARD_TAB[card.key];

        const isActive = tabKey === activeTabKey;

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => tabKey && onSelect?.(tabKey)}
            aria-pressed={isActive}
            className={`group flex cursor-pointer flex-col items-start gap-2.5 rounded-2xl border bg-surface p-3.5 text-start shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${
              isActive
                ? "border-brand-400 ring-1 ring-brand-400/30"
                : "border-line hover:border-brand-200"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                TONES[card.key] ?? TONES.total
              }`}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium text-muted">
                {card.label}
              </span>

              {card.isLoading ? (
                <Skeleton className="mt-1.5 h-6 w-12" />
              ) : (
                <span
                  className="tnum mt-0.5 block text-xl font-extrabold text-ink sm:text-2xl"
                  title={card.isError ? "تعذّر تحميل هذا العدد" : undefined}
                >
                  {card.value === null ? "—" : formatNumber(card.value)}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
