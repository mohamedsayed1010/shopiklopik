import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Crown,
  MousePointerClick,
  Share2,
  Sun,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import Skeleton from "../../../../components/ui/Skeleton";
import EmptyState from "../../../../components/ui/EmptyState";
import { formatDateTime, formatNumber } from "../../../../utils/format";
import { referralInitials } from "../../../Referrals/referralsConstants";

const TILES = [
  { key: "totalReferrals", label: "إجمالي الدعوات", icon: Users, tone: "brand" },
  {
    key: "completedReferrals",
    label: "دعوات مكتملة",
    icon: CheckCircle2,
    tone: "emerald",
  },
  {
    key: "pendingReferrals",
    label: "قيد الانتظار",
    icon: Clock3,
    tone: "amber",
  },
  {
    key: "activeReferrers",
    label: "الداعون النشطون",
    icon: UserCheck,
    tone: "brand",
  },
  { key: "today", label: "اليوم", icon: Sun, tone: "soft" },
  { key: "thisWeek", label: "هذا الأسبوع", icon: CalendarDays, tone: "soft" },
  { key: "thisMonth", label: "هذا الشهر", icon: CalendarRange, tone: "soft" },
  { key: "totalShares", label: "مرات المشاركة", icon: Share2, tone: "soft" },
  { key: "totalClicks", label: "النقرات", icon: MousePointerClick, tone: "soft" },
  {
    key: "conversionRate",
    label: "معدل التحويل",
    icon: TrendingUp,
    tone: "brand",
    raw: true,
  },
];

const TONES = {
  brand: "bg-brand-50 text-brand-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  soft: "bg-canvas text-ink-soft",
};

const RANK_TONES = [
  "bg-gold-300 text-brand-900",
  "bg-brand-100 text-brand-800",
  "bg-amber-100 text-amber-800",
];

export function AdminReferralStatsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
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

      <div className="rounded-3xl border border-line bg-surface p-5 shadow-xs">
        <Skeleton className="h-4 w-32" />

        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 flex-1" />
              <Skeleton className="h-3.5 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopReferrers({ referrers }) {
  if (!referrers.length) {
    return (
      <EmptyState
        icon={Crown}
        title="لا يوجد داعون بعد"
        description="سيظهر هنا ترتيب أكثر المستخدمين دعوةً بمجرد تسجيل أول دعوة."
      />
    );
  }

  return (
    <>
      {/* Phones: cards. */}
      <ul className="space-y-3 md:hidden">
        {referrers.map((referrer, index) => (
          <li
            key={referrer.userId ?? index}
            className="rounded-2xl border border-line bg-surface p-4 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span
                className={`tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                  RANK_TONES[index] ?? "bg-canvas text-ink-soft"
                }`}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">
                  {referrer.name || referrer.userName || "—"}
                </p>

                <p dir="ltr" className="mt-0.5 truncate text-[12px] text-muted">
                  {referrer.userName ? `@${referrer.userName}` : "—"}
                </p>
              </div>

              <span
                dir="ltr"
                className="shrink-0 rounded-lg bg-canvas px-2 py-1 text-[12px] font-semibold text-ink-soft"
              >
                {referrer.referralCode || "—"}
              </span>
            </div>

            <div className="tnum mt-3 flex items-center gap-4 border-t border-line pt-3 text-[13px]">
              <span className="text-muted">
                الإجمالي:{" "}
                <span className="font-bold text-ink">
                  {formatNumber(referrer.totalReferrals ?? 0)}
                </span>
              </span>

              <span className="text-muted">
                مكتملة:{" "}
                <span className="font-bold text-emerald-700">
                  {formatNumber(referrer.completedReferrals ?? 0)}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Tablets and up: the ranking table. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
        <table className="w-full min-w-[620px] text-start text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-[13px] text-muted">
              <th className="px-4 py-3 text-start font-semibold">#</th>
              <th className="px-4 py-3 text-start font-semibold">الداعي</th>
              <th className="px-4 py-3 text-start font-semibold">اسم المستخدم</th>
              <th className="px-4 py-3 text-start font-semibold">الكود</th>
              <th className="px-4 py-3 text-start font-semibold">الإجمالي</th>
              <th className="px-4 py-3 text-start font-semibold">مكتملة</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {referrers.map((referrer, index) => (
              <tr
                key={referrer.userId ?? index}
                className="transition-colors hover:bg-brand-50/40"
              >
                <td className="px-4 py-3">
                  <span
                    className={`tnum flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold ${
                      RANK_TONES[index] ?? "bg-canvas text-ink-soft"
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700">
                      {referralInitials(referrer.name, referrer.userName)}
                    </span>

                    <span className="truncate font-semibold text-ink">
                      {referrer.name || "—"}
                    </span>
                  </div>
                </td>

                <td dir="ltr" className="px-4 py-3 text-start text-ink-soft">
                  {referrer.userName ? `@${referrer.userName}` : "—"}
                </td>

                <td dir="ltr" className="px-4 py-3 text-start">
                  <span className="rounded-lg bg-canvas px-2 py-1 text-[12px] font-semibold text-ink-soft">
                    {referrer.referralCode || "—"}
                  </span>
                </td>

                <td className="tnum px-4 py-3 font-bold text-ink">
                  {formatNumber(referrer.totalReferrals ?? 0)}
                </td>

                <td className="tnum px-4 py-3 font-bold text-emerald-700">
                  {formatNumber(referrer.completedReferrals ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminReferralStats({
  statistics,
  topReferrers = [],
  topControl = null,
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
        {TILES.map(({ key, label, icon: Icon, tone, raw }) => {
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
                {typeof value !== "number"
                  ? "—"
                  : raw
                  ? String(value)
                  : formatNumber(value)}
              </p>

              <p className="mt-1 truncate text-[13px] text-muted">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-sm font-bold text-ink">
            <span
              aria-hidden="true"
              className="h-4 w-1 rounded-full bg-gold-300"
            />
            <Crown size={16} className="text-gold-600" aria-hidden="true" />
            أكثر الداعين نشاطًا
          </h2>

          {topControl}
        </div>

        <TopReferrers referrers={topReferrers} />

        {statistics?.generatedAt && (
          <p className="mt-4 text-[12px] text-muted">
            آخر تحديث للإحصائيات: {formatDateTime(statistics.generatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
