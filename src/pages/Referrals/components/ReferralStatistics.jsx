import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Sun,
  Users,
} from "lucide-react";

import Skeleton from "../../../components/ui/Skeleton";
import { formatNumber, formatDateTime } from "../../../utils/format";

const TILES = [
  { key: "total", label: "إجمالي الدعوات", icon: Users, tone: "brand" },
  { key: "completed", label: "مكتملة", icon: CheckCircle2, tone: "emerald" },
  { key: "pending", label: "قيد الانتظار", icon: Clock3, tone: "amber" },
  { key: "today", label: "اليوم", icon: Sun, tone: "soft" },
  { key: "thisWeek", label: "هذا الأسبوع", icon: CalendarDays, tone: "soft" },
  { key: "thisMonth", label: "هذا الشهر", icon: CalendarRange, tone: "soft" },
];

const TONES = {
  brand: "bg-brand-50 text-brand-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  soft: "bg-canvas text-ink-soft",
};

export function StatisticsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {TILES.map((tile) => (
        <div
          key={tile.key}
          className="rounded-2xl border border-line bg-surface p-4 shadow-xs"
        >
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="mt-3 h-6 w-14" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function ReferralStatistics({ statistics }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map(({ key, label, icon: Icon, tone }) => {
          const value = statistics?.[key];

          return (
            <div
              key={key}
              className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-xs"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${TONES[tone]}`}
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
              </span>

              <p className="tnum mt-3 text-xl font-extrabold text-ink">
                {typeof value === "number" ? formatNumber(value) : "—"}
              </p>

              <p className="mt-1 truncate text-[13px] text-muted">{label}</p>
            </div>
          );
        })}
      </div>

      {statistics?.generatedAt && (
        <p className="mt-3 text-[12px] text-muted">
          آخر تحديث للإحصائيات: {formatDateTime(statistics.generatedAt)}
        </p>
      )}
    </div>
  );
}
