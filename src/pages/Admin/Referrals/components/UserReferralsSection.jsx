import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Share2, UserRoundCheck, UserRoundPlus } from "lucide-react";

import Button from "../../../../components/ui/Button";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import { useAdminUserReferrals } from "../../../../hooks/admin/useAdminReferrals";
import { formatDateTime, formatNumber } from "../../../../utils/format";
import {
  referralInitials,
  referralStatusTone,
} from "../../../Referrals/referralsConstants";
import { apiErrorText } from "../../../../utils/apiErrors";

const PAGE_SIZE = 5;

function Side({ isReferrer }) {
  const Icon = isReferrer ? UserRoundPlus : UserRoundCheck;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        isReferrer
          ? "bg-brand-50 text-brand-700 ring-brand-200"
          : "bg-gold-50 text-gold-700 ring-gold-200"
      }`}
    >
      <Icon size={12} aria-hidden="true" />
      {isReferrer ? "داعٍ" : "مدعو"}
    </span>
  );
}

export default function UserReferralsSection({ userId }) {
  const [pageIndex, setPageIndex] = useState(1);

  const filters = useMemo(
    () => ({ pageIndex, pageSize: PAGE_SIZE }),
    [pageIndex]
  );

  const query = useAdminUserReferrals({ userId, filters });

  const result = query.data?.data;

  const rows = result?.items ?? [];

  const status = query.error?.response?.status;

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />

            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/4" />
            </div>

            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (status === 401 || status === 403) {
    return (
      <p className="rounded-2xl border border-line bg-canvas px-4 py-6 text-center text-sm text-muted">
        لا تملك صلاحية عرض دعوات هذا الحساب.
      </p>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="تعذّر تحميل الدعوات"
        description={apiErrorText(
          query.error,
          "حدث خطأ أثناء جلب دعوات هذا الحساب."
        )}
        onRetry={query.refetch}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Share2}
        title="لا توجد دعوات"
        description="هذا الحساب ليس طرفًا في أي دعوة حتى الآن."
      />
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {rows.map((row) => {
          /* The row states both ids; the account is whichever one matches. */
          const isReferrer = String(row.referrerUserId) === String(userId);

          const other = isReferrer
            ? { name: row.referredName, userName: row.referredUserName }
            : { name: row.referrerName, userName: row.referrerUserName };

          return (
            <li
              key={row.id}
              className="rounded-2xl border border-line bg-surface p-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-[12px] font-bold text-ink-soft">
                  {referralInitials(other.name, other.userName)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {other.name || "—"}
                  </p>

                  <p
                    dir="ltr"
                    className="truncate text-start text-[12px] text-muted"
                  >
                    {other.userName ? `@${other.userName}` : "—"}
                  </p>
                </div>

                <Side isReferrer={isReferrer} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {row.statusName && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${referralStatusTone(
                        row.statusName
                      )}`}
                    >
                      {row.statusName}
                    </span>
                  )}

                  <span
                    dir="ltr"
                    className="rounded-lg bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-soft"
                  >
                    {row.referralCode || "—"}
                  </span>

                  <span className="tnum text-[11px] text-muted">
                    {formatDateTime(row.createdAt)}
                  </span>
                </div>

                <Link
                  to={`/admin/referrals/${row.id}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
                >
                  التفاصيل
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {(result?.hasPrevious || result?.hasNext) && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!result?.hasPrevious}
            onClick={() => setPageIndex((page) => Math.max(1, page - 1))}
          >
            السابق
          </Button>

          <span className="tnum text-[12px] text-muted">
            صفحة {formatNumber(result?.pageIndex ?? pageIndex)} من{" "}
            {formatNumber(result?.totalPages ?? 1)} ·{" "}
            {formatNumber(result?.totalCount ?? rows.length)} دعوة
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!result?.hasNext}
            onClick={() => setPageIndex((page) => page + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
