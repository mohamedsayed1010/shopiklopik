import {
  AlertTriangle,
  BadgeDollarSign,
  CreditCard,
  Image as ImageIcon,
  Megaphone,
  Users,
} from "lucide-react";

import Skeleton from "../../../../components/ui/Skeleton";
import { formatNumber } from "../../../../utils/format";

function StatCard({
  icon: Icon,
  label,
  value,
  breakdown,
  tone = "brand",
  urgent = false,
  isLoading,
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    gold: "bg-gold-50 text-gold-700",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div
      className={`rounded-2xl border bg-surface p-4 shadow-xs transition-shadow duration-200 hover:shadow-md ${
        urgent && value > 0
          ? "border-red-200 ring-1 ring-red-100"
          : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={18} strokeWidth={2} aria-hidden="true" />
        </span>

        {urgent && value > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-bold text-red-700 ring-1 ring-inset ring-red-200">
            <AlertTriangle size={11} aria-hidden="true" />
            يحتاج مراجعة
          </span>
        )}
      </div>

      <p className="mt-3 text-[12.5px] font-medium text-muted">{label}</p>

      {isLoading ? (
        <Skeleton className="mt-1.5 h-7 w-20" />
      ) : (
        <p className="mt-0.5 text-2xl font-extrabold text-ink">
          {value === null || value === undefined ? "—" : formatNumber(value)}
        </p>
      )}

      {breakdown?.length > 0 && !isLoading && (
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2.5">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-baseline gap-1.5">
              <dt className="text-[11.5px] text-muted">{item.label}</dt>
              <dd
                className={`tnum text-[12px] font-bold ${
                  item.emphasis && item.value > 0
                    ? "text-red-600"
                    : "text-ink-soft"
                }`}
              >
                {formatNumber(item.value ?? 0)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default function DashboardStats({ stats, isLoading }) {
  const s = stats ?? {};

  const currency = s.currency || "";

  const money = (value) =>
    `${formatNumber(Math.round(value ?? 0))}${currency ? ` ${currency}` : ""}`;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        icon={Users}
        label="المستخدمون"
        value={s.usersCount}
        tone="brand"
        isLoading={isLoading}
        breakdown={[
          { label: "نشط", value: s.activeUsersCount },
          { label: "موقوف", value: s.suspendedUsersCount, emphasis: true },
        ]}
      />

      <StatCard
        icon={Megaphone}
        label="الإعلانات"
        value={s.adsCount}
        tone="emerald"
        isLoading={isLoading}
        breakdown={[
          { label: "نشط", value: s.activeAdsCount },
          { label: "قيد المراجعة", value: s.pendingAdsCount, emphasis: true },
          { label: "مرفوض", value: s.rejectedAdsCount },
          { label: "موقوف", value: s.suspendedAdsCount },
        ]}
      />

      <StatCard
        icon={BadgeDollarSign}
        label={`إجمالي الإيرادات${currency ? ` (${currency})` : ""}`}
        value={s.totalRevenue}
        tone="gold"
        isLoading={isLoading}
        breakdown={[
          { label: "هذا الشهر", value: s.monthlyRevenue },
          { label: "البانرات", value: s.bannerRevenue },
        ]}
      />

      <StatCard
        icon={AlertTriangle}
        label="بلاغات قيد المراجعة"
        value={s.pendingReportsCount}
        tone="red"
        urgent
        isLoading={isLoading}
      />

      <StatCard
        icon={CreditCard}
        label="مدفوعات قيد المراجعة"
        value={s.pendingPaymentsCount}
        tone="violet"
        urgent
        isLoading={isLoading}
      />

      <StatCard
        icon={ImageIcon}
        label="البانرات النشطة"
        value={s.activeBannersCount}
        tone="brand"
        isLoading={isLoading}
        breakdown={[
          {
            label: "طلبات معلّقة",
            value: s.pendingBannerRequestsCount,
            emphasis: true,
          },
        ]}
      />

      {/* Revenue is a currency figure, so it says so rather than showing a bare
          integer the reader has to guess the unit of. */}
      <span className="sr-only">
        إجمالي الإيرادات {money(s.totalRevenue)}، إيرادات الشهر{" "}
        {money(s.monthlyRevenue)}، إيرادات البانرات {money(s.bannerRevenue)}
      </span>
    </div>
  );
}
