import { CheckCircle2, Clock3, LayoutGrid, TimerOff, XCircle } from "lucide-react";

import useCountUp from "../../../hooks/useCountUp";
import { formatNumber } from "../../../utils/format";

const CARDS = [
  {
    key: "totalListings",
    label: "إجمالي الإعلانات",
    icon: LayoutGrid,
    iconClass: "bg-brand-100 text-brand-700",
    wash: "from-brand-100/70",
  },
  {
    key: "activeListings",
    label: "إعلانات نشطة",
    icon: CheckCircle2,
    iconClass: "bg-green-100 text-green-700",
    wash: "from-green-100/70",
  },
  {
    key: "pendingListings",
    label: "قيد المراجعة",
    icon: Clock3,
    iconClass: "bg-gold-100 text-gold-700",
    wash: "from-gold-100/70",
  },
  {
    key: "expiredListings",
    label: "إعلانات منتهية",
    icon: TimerOff,
    iconClass: "bg-brand-100 text-brand-500",
    wash: "from-brand-100/60",
  },
  {
    key: "rejectedListings",
    label: "إعلانات مرفوضة",
    icon: XCircle,
    iconClass: "bg-red-100 text-red-700",
    wash: "from-red-100/70",
  },
];

function StatCard({ label, value, icon: Icon, iconClass, wash }) {
  const shown = useCountUp(value);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-xs transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg sm:p-5">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${wash} to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon size={19} strokeWidth={2} aria-hidden="true" />
        </span>

        <p className="tnum mt-4 text-[26px] font-bold leading-9 text-ink sm:text-[30px]">
          {formatNumber(shown)}
        </p>

        <p className="mt-0.5 text-[13px] font-medium leading-5 text-muted">
          {label}
        </p>
      </div>
    </article>
  );
}

export default function StatCards({ statistics }) {
  if (!statistics) return null;

  const cards = CARDS.filter((card) =>
    Number.isFinite(Number(statistics[card.key]))
  );

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={statistics[card.key]}
          icon={card.icon}
          iconClass={card.iconClass}
          wash={card.wash}
        />
      ))}
    </div>
  );
}
