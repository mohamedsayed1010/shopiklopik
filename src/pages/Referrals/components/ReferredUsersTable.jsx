import Skeleton from "../../../components/ui/Skeleton";
import { formatDateTime } from "../../../utils/format";
import { referralInitials, referralStatusTone } from "../referralsConstants";

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

function Avatar({ name }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700">
      {referralInitials(name)}
    </span>
  );
}

export function ReferredUsersSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>

          <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

export default function ReferredUsersTable({ users = [] }) {
  return (
    <>
      {/* Phones: one card per person. */}
      <ul className="space-y-3 md:hidden">
        {users.map((user) => (
          <li
            key={user.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <Avatar name={user.name} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">
                  {user.name || "—"}
                </p>

                <p className="mt-0.5 truncate text-[12px] text-muted">
                  انضم: {formatDateTime(user.registeredAt)}
                </p>
              </div>

              <StatusBadge statusName={user.statusName} />
            </div>

            {user.completedAt && (
              <p className="mt-3 border-t border-line pt-3 text-[12px] text-muted">
                اكتملت: {formatDateTime(user.completedAt)}
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* Tablets and up: the table. `overflow-x-auto` keeps a long name from
          widening the page rather than the table. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs md:block">
        <table className="w-full min-w-[560px] text-start text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-[13px] text-muted">
              <th className="px-4 py-3 text-start font-semibold">المستخدم</th>
              <th className="px-4 py-3 text-start font-semibold">تاريخ التسجيل</th>
              <th className="px-4 py-3 text-start font-semibold">الحالة</th>
              <th className="px-4 py-3 text-start font-semibold">تاريخ الاكتمال</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-brand-50/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} />

                    <span className="truncate font-semibold text-ink">
                      {user.name || "—"}
                    </span>
                  </div>
                </td>

                <td className="tnum whitespace-nowrap px-4 py-3 text-ink-soft">
                  {formatDateTime(user.registeredAt)}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge statusName={user.statusName} />
                </td>

                <td className="tnum whitespace-nowrap px-4 py-3 text-ink-soft">
                  {user.completedAt ? formatDateTime(user.completedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
