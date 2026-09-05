import { ChevronLeft, Crown, ShieldCheck } from "lucide-react";

import { accountStatusTone, initialsOf } from "../accountsConstants";
import { formatDate, formatNumber } from "../../../../utils/format";

const HEADERS = [
  "المسؤول",
  "التواصل",
  "الصفحات",
  "الحالة",
  "النوع",
  "الإنشاء",
  "",
];

function AccountAvatar({ account, size = 40 }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-900 to-brand-700 text-[13px] font-bold text-gold-300"
    >
      {initialsOf(account.name, account.userName)}
    </span>
  );
}

function StatusBadge({ account }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${accountStatusTone(
        account.isActive
      )}`}
    >
      {account.statusName || (account.isActive ? "مفعّل" : "معطّل")}
    </span>
  );
}

function RoleMark({ isSuperAdmin }) {
  if (!isSuperAdmin) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
        <ShieldCheck size={12} aria-hidden="true" />
        مسؤول
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-700 ring-1 ring-inset ring-gold-200">
      <Crown size={12} aria-hidden="true" />
      مسؤول أعلى
    </span>
  );
}

export default function AdminAccountsTable({ accounts, onOpen }) {
  return (
    <>
      {/* ---------- phones and tablets ---------- */}
      <ul className="space-y-3 lg:hidden">
        {accounts.map((account) => (
          <li key={account.id}>
            <button
              type="button"
              onClick={() => onOpen(account)}
              className="w-full cursor-pointer rounded-2xl border border-line bg-surface p-3.5 text-start shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <AccountAvatar account={account} size={44} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-ink">
                    {account.name || account.userName || "—"}
                  </p>

                  <p dir="ltr" className="truncate text-start text-[11.5px] text-muted">
                    @{account.userName}
                  </p>
                </div>

                <StatusBadge account={account} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-[12px]">
                <div className="min-w-0">
                  <dt className="text-muted">الهاتف</dt>
                  <dd
                    dir="ltr"
                    className="tnum truncate text-start font-medium text-ink-soft"
                  >
                    {account.phone || "—"}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-muted">الصفحات</dt>
                  <dd className="tnum font-medium text-ink-soft">
                    {formatNumber(account.pagesCount ?? 0)}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-muted">النوع</dt>
                  <dd>
                    <RoleMark isSuperAdmin={account.isSuperAdmin} />
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-muted">الإنشاء</dt>
                  <dd className="tnum truncate font-medium text-ink-soft">
                    {formatDate(account.createdAt) || "—"}
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
            {accounts.map((account) => (
              <tr
                key={account.id}
                onClick={() => onOpen(account)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;

                  event.preventDefault();

                  onOpen(account);
                }}
                className="cursor-pointer transition-colors duration-150 hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none"
              >
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <AccountAvatar account={account} />

                    <div className="min-w-0">
                      <p className="max-w-[190px] truncate text-[13.5px] font-semibold text-ink">
                        {account.name || "—"}
                      </p>

                      <p
                        dir="ltr"
                        className="max-w-[190px] truncate text-start text-[11.5px] text-muted"
                      >
                        @{account.userName}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <p
                    dir="ltr"
                    className="tnum max-w-[180px] truncate text-start text-[12.5px] text-ink-soft"
                  >
                    {account.phone || "—"}
                  </p>

                  <p
                    dir="ltr"
                    className="max-w-[180px] truncate text-start text-[11.5px] text-muted"
                    title={account.email || undefined}
                  >
                    {account.email || ""}
                  </p>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[13px] font-bold text-ink-soft">
                    {formatNumber(account.pagesCount ?? 0)}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <StatusBadge account={account} />
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <RoleMark isSuperAdmin={account.isSuperAdmin} />
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[12.5px] text-muted">
                    {formatDate(account.createdAt) || "—"}
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
