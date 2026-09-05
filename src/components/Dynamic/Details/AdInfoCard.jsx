import { CalendarDays, CalendarX2, Eye, Timer } from "lucide-react";

import Panel from "./Panel";
import { formatDate, formatNumber } from "../../../utils/format";

export default function AdInfoCard({ meta }) {
  const rows = [];

  if (meta.createdAt) {
    rows.push({
      key: "createdAt",
      icon: CalendarDays,
      label: "تاريخ النشر",
      value: formatDate(meta.createdAt),
    });
  }

  if (meta.expireAt) {
    rows.push({
      key: "expireAt",
      icon: CalendarX2,
      label: "تاريخ الانتهاء",
      value: formatDate(meta.expireAt),
    });
  }

  if (Number.isFinite(meta.remainingDays) && meta.remainingDays > 0) {
    rows.push({
      key: "remainingDays",
      icon: Timer,
      label: "الأيام المتبقية",
      value: `${formatNumber(meta.remainingDays)} يوم`,
    });
  }

  if (meta.views > 0) {
    rows.push({
      key: "views",
      icon: Eye,
      label: "عدد المشاهدات",
      value: formatNumber(meta.views),
    });
  }

  if (rows.length === 0) return null;

  return (
    <Panel title="معلومات الإعلان">
      <dl className="space-y-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 border-b border-line/60 py-2.5 last:border-0 last:pb-0"
          >
            <dt className="flex items-center gap-2 text-[13px] text-muted">
              <row.icon size={15} className="shrink-0 text-brand-400" />
              {row.label}
            </dt>

            <dd className="tnum text-[13.5px] font-bold text-ink">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
