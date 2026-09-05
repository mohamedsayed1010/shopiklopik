import { ChevronLeft, ShieldCheck } from "lucide-react";

import UserAvatar from "./UserAvatar";
import { userStatusTone } from "../usersConstants";
import { formatDate, formatNumber } from "../../../../utils/format";

const HEADERS = ["المستخدم", "التواصل", "الإعلانات", "الحالة", "النوع", "التسجيل", ""];

function StatusBadge({ user }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${userStatusTone(
        user.statusName
      )}`}
    >
      {user.statusName || "—"}
    </span>
  );
}

function AdminMark({ isAdmin }) {
  if (!isAdmin) {
    return <span className="text-[12px] text-muted">مستخدم</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
      <ShieldCheck size={12} aria-hidden="true" />
      مسؤول
    </span>
  );
}

export default function AdminUsersTable({ users, onOpen }) {
  return (
    <>
      {/* ---------- phones and tablets ---------- */}
      <ul className="space-y-3 lg:hidden">
        {users.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              onClick={() => onOpen(user)}
              className="w-full cursor-pointer rounded-2xl border border-line bg-surface p-3.5 text-start shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={user} size={44} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-ink">
                    {user.name || user.userName || "—"}
                  </p>

                  <p className="truncate text-[11.5px] text-muted">
                    @{user.userName}
                  </p>
                </div>

                <StatusBadge user={user} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-[12px]">
                <div className="min-w-0">
                  <dt className="text-muted">الهاتف</dt>
                  <dd dir="ltr" className="tnum truncate text-start font-medium text-ink-soft">
                    {user.phone || "—"}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-muted">الإعلانات</dt>
                  <dd className="tnum font-medium text-ink-soft">
                    {formatNumber(user.adsCount ?? 0)}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-muted">النوع</dt>
                  <dd>
                    <AdminMark isAdmin={user.isAdmin} />
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-muted">التسجيل</dt>
                  <dd className="tnum truncate font-medium text-ink-soft">
                    {formatDate(user.createdAt) || "—"}
                  </dd>
                </div>
              </dl>
            </button>
          </li>
        ))}
      </ul>

      {/* ---------- desktop ---------- */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full min-w-[900px] border-collapse text-start">
          <thead>
            <tr className="border-b border-line bg-canvas">
              {HEADERS.map((header, index) => (
                <th
                  key={header || `spacer-${index}`}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3 text-start text-[12px] font-bold uppercase tracking-wide text-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => onOpen(user)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;

                  event.preventDefault();

                  onOpen(user);
                }}
                className="cursor-pointer transition-colors duration-150 hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none"
              >
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar user={user} />

                    <div className="min-w-0">
                      <p className="max-w-[190px] truncate text-[13.5px] font-semibold text-ink">
                        {user.name || "—"}
                      </p>

                      <p className="max-w-[190px] truncate text-[11.5px] text-muted">
                        @{user.userName}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <p
                    dir="ltr"
                    className="tnum max-w-[180px] truncate text-start text-[12.5px] text-ink-soft"
                  >
                    {user.phone || "—"}
                  </p>

                  <p
                    dir="ltr"
                    className="max-w-[180px] truncate text-start text-[11.5px] text-muted"
                    title={user.email || undefined}
                  >
                    {user.email || ""}
                  </p>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[13px] font-bold text-ink-soft">
                    {formatNumber(user.adsCount ?? 0)}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <StatusBadge user={user} />
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <AdminMark isAdmin={user.isAdmin} />
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[12.5px] text-muted">
                    {formatDate(user.createdAt) || "—"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <ChevronLeft
                    size={16}
                    aria-hidden="true"
                    className="text-line-strong"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
