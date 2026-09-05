import { ArrowLeftRight, Eye } from "lucide-react";

import Skeleton from "../../../../components/ui/Skeleton";
import { formatDateTime } from "../../../../utils/format";
import {
  referralInitials,
  referralStatusTone,
} from "../../../Referrals/referralsConstants";

export function AdminReferralsTableSkeleton({ rows = 8 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>

          <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />
          <Skeleton className="hidden h-3 w-24 shrink-0 md:block" />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ statusName }) {
  if (!statusName) return <span className="text-muted">—</span>;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${referralStatusTone(
        statusName
      )}`}
    >
      {statusName}
    </span>
  );
}

function Person({ name, userName }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-bold text-brand-700">
        {referralInitials(name, userName)}
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{name || "—"}</p>

        <p dir="ltr" className="truncate text-start text-[12px] text-muted">
          {userName ? `@${userName}` : "—"}
        </p>
      </div>
    </div>
  );
}

export default function AdminReferralsTable({ referrals = [], onOpen }) {
  return (
    <>
      {/* Phones: one card per referral. */}
      <ul className="space-y-3 lg:hidden">
        {referrals.map((referral) => (
          <li
            key={referral.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-xs"
          >
            <button
              type="button"
              onClick={() => onOpen?.(referral)}
              className="w-full cursor-pointer text-start"
            >
              <div className="flex items-start justify-between gap-3">
                <Person
                  name={referral.referrerName}
                  userName={referral.referrerUserName}
                />

                <StatusBadge statusName={referral.statusName} />
              </div>

              <div className="my-3 flex items-center gap-2 text-[12px] text-muted">
                <ArrowLeftRight size={14} aria-hidden="true" />
                دعا
              </div>

              <Person
                name={referral.referredName}
                userName={referral.referredUserName}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[12px] text-muted">
                <span dir="ltr" className="rounded-lg bg-canvas px-2 py-1 font-semibold text-ink-soft">
                  {referral.referralCode || "—"}
                </span>

                <span className="tnum">
                  {formatDateTime(referral.createdAt)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: the full table. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full min-w-[900px] text-start text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-[13px] text-muted">
              <th className="px-4 py-3 text-start font-semibold">الداعي</th>
              <th className="px-4 py-3 text-start font-semibold">المدعو</th>
              <th className="px-4 py-3 text-start font-semibold">الكود</th>
              <th className="px-4 py-3 text-start font-semibold">الحالة</th>
              <th className="px-4 py-3 text-start font-semibold">تاريخ الإنشاء</th>
              <th className="px-4 py-3 text-start font-semibold">تاريخ الاكتمال</th>
              <th className="px-4 py-3 text-start font-semibold">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {referrals.map((referral) => (
              <tr
                key={referral.id}
                className="transition-colors hover:bg-brand-50/40"
              >
                <td className="px-4 py-3">
                  <Person
                    name={referral.referrerName}
                    userName={referral.referrerUserName}
                  />
                </td>

                <td className="px-4 py-3">
                  <Person
                    name={referral.referredName}
                    userName={referral.referredUserName}
                  />
                </td>

                <td dir="ltr" className="px-4 py-3 text-start">
                  <span className="rounded-lg bg-canvas px-2 py-1 text-[12px] font-semibold text-ink-soft">
                    {referral.referralCode || "—"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <StatusBadge statusName={referral.statusName} />
                </td>

                <td className="tnum whitespace-nowrap px-4 py-3 text-ink-soft">
                  {formatDateTime(referral.createdAt)}
                </td>

                <td className="tnum whitespace-nowrap px-4 py-3 text-ink-soft">
                  {referral.completedAt
                    ? formatDateTime(referral.completedAt)
                    : "—"}
                </td>

                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpen?.(referral)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
                  >
                    <Eye size={15} />
                    التفاصيل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
