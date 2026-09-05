import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CalendarClock,
  CircleDollarSign,
  Clock,
  Hourglass,
  Radio,
  Wallet,
  XCircle,
} from "lucide-react";

import Skeleton from "../../../../components/ui/Skeleton";
import BannerStatusBadge from "./BannerStatusBadge";
import { formatMoney, formatDateTime } from "../../../../utils/format";
import { formatNumber } from "../../../../utils/format";

const CARDS = [
  { key: "pendingRequests", label: "طلبات قيد الانتظار", icon: Hourglass, tone: "gold" },
  { key: "paymentPending", label: "دفع قيد المراجعة", icon: Wallet, tone: "gold" },
  { key: "paymentApproved", label: "دفع معتمد", icon: BadgeCheck, tone: "brand" },
  { key: "active", label: "نشطة", icon: Radio, tone: "emerald" },
  { key: "expiringSoon", label: "تنتهي قريبًا", icon: CalendarClock, tone: "orange" },
  { key: "expired", label: "منتهية", icon: Clock, tone: "slate" },
  { key: "rejected", label: "مرفوضة", icon: XCircle, tone: "red" },
  { key: "cancelled", label: "ملغاة", icon: Ban, tone: "slate" },
];

const TONES = {
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-300",
};

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${TONES[tone]}`}
      >
        <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <p className="tnum mt-3 text-xl font-extrabold text-ink">
        {formatNumber(value ?? 0)}
      </p>

      <p className="mt-0.5 text-[12px] leading-5 text-muted">{label}</p>
    </div>
  );
}

function RevenueCard({ label, value, currency }) {
  return (
    <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-900 to-brand-700 p-4 text-white shadow-xs">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-300 ring-1 ring-inset ring-white/15">
        <CircleDollarSign size={17} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <p className="tnum mt-3 text-xl font-extrabold">
        {formatMoney(value ?? 0, currency)}
      </p>

      <p className="mt-0.5 text-[12px] leading-5 text-brand-200">{label}</p>
    </div>
  );
}

export default function BannerCenterPanel({ query, onOpenRequest }) {
  const data = query.data?.data ?? null;

  if (query.isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>

      </div>
    );
  }

  if (query.isError || !data) return null;

  const summary = data.summary ?? {};

  const expiring = data.expiringSoon ?? [];

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map((card) => (
          <StatCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={summary[card.key]}
            tone={card.tone}
          />
        ))}

        <RevenueCard
          label="إجمالي الإيرادات"
          value={summary.totalRevenue}
          currency={summary.currency}
        />

        <RevenueCard
          label="إيرادات الشهر"
          value={summary.monthlyRevenue}
          currency={summary.currency}
        />
      </div>

      {/* Expiring soon */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
          <AlertTriangle
            size={17}
            strokeWidth={2}
            aria-hidden="true"
            className="text-orange-500"
          />
          تنتهي قريبًا
        </h3>

        {expiring.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-6 text-center text-[13px] text-muted">
            لا توجد بانرات على وشك الانتهاء.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {expiring.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenRequest?.(item.id)}
                  className="w-full cursor-pointer rounded-2xl border border-orange-200 bg-orange-50/60 p-3.5 text-start transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 text-[13.5px] font-bold text-ink">
                      {item.title || "—"}
                    </span>

                    <span className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <BannerStatusBadge
                        status={item.paymentStatus}
                        statusName={item.paymentStatusName}
                        kind="payment"
                        size="sm"
                      />

                      <BannerStatusBadge
                        status={item.status}
                        statusName={item.statusName}
                        size="sm"
                      />
                    </span>
                  </span>

                  <span className="mt-1 block truncate text-[12.5px] text-ink-soft">
                    {item.advertiserName || "—"}
                  </span>

                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                    <span>{item.locationName}</span>

                    {item.slotNumber != null && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tnum">مساحة {item.slotNumber}</span>
                      </>
                    )}

                    <span aria-hidden="true">·</span>

                    <span className="tnum">
                      {formatMoney(item.price, item.currency)}
                    </span>

                    {item.submittedAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tnum">
                          {formatDateTime(item.submittedAt)}
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
