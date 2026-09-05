import { ArrowLeftRight, ChevronLeft, UserCog } from "lucide-react";

import { actionTone, targetTone } from "../auditLogsConstants";
import { formatDateTime } from "../../../../utils/format";

const HEADERS = [
  "المسؤول",
  "العملية",
  "نوع العنصر",
  "الوصف",
  "التاريخ",
  "",
];

function Badge({ tone, children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${tone}`}
    >
      {children}
    </span>
  );
}

function ChangeMark({ hasChange }) {
  if (!hasChange) return null;

  return (
    <span
      title="يتضمّن تغييرًا في القيمة"
      aria-label="يتضمّن تغييرًا في القيمة"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600"
    >
      <ArrowLeftRight size={12} aria-hidden="true" />
    </span>
  );
}

export default function AdminAuditTable({ entries, onOpen }) {
  return (
    <>
      {/* ---------- phones and tablets ---------- */}
      <ul className="space-y-3 lg:hidden">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onOpen(entry)}
              className="w-full cursor-pointer rounded-2xl border border-line bg-surface p-3.5 text-start shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={actionTone(entry.actionName)}>
                  {entry.actionName || "—"}
                </Badge>

                <Badge tone={targetTone(entry.targetType)}>
                  {entry.targetTypeName || entry.targetType || "—"}
                </Badge>

                <ChangeMark hasChange={entry.hasChange} />
              </div>

              <p className="mt-2.5 line-clamp-2 text-[14px] font-semibold leading-6 text-ink">
                {entry.description || "—"}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2.5 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <UserCog size={13} aria-hidden="true" />
                  {entry.adminName || "—"}
                </span>

                <span className="tnum">{formatDateTime(entry.createdAt)}</span>

              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* ---------- desktop ---------- */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full min-w-[880px] border-collapse text-start">
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
            {entries.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => onOpen(entry)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;

                  event.preventDefault();

                  onOpen(entry);
                }}
                className="cursor-pointer transition-colors duration-150 hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none"
              >
                <td className="whitespace-nowrap px-3 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                      <UserCog size={14} aria-hidden="true" />
                    </span>

                    <span className="text-[13px] font-medium text-ink-soft">
                      {entry.adminName || "—"}
                    </span>
                  </span>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <Badge tone={actionTone(entry.actionName)}>
                    {entry.actionName || "—"}
                  </Badge>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <Badge tone={targetTone(entry.targetType)}>
                    {entry.targetTypeName || entry.targetType || "—"}
                  </Badge>
                </td>

                <td className="px-3 py-3">
                  <span className="flex items-center gap-2">
                    <span className="line-clamp-1 max-w-[320px] text-[13px] text-ink-soft">
                      {entry.description || "—"}
                    </span>

                    <ChangeMark hasChange={entry.hasChange} />
                  </span>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[12.5px] text-muted">
                    {formatDateTime(entry.createdAt) || "—"}
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
