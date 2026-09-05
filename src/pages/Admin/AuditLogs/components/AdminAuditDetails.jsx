import { useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Copy,
  Globe,
  Minus,
} from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import {
  actionTone,
  parseAuditValue,
  targetTone,
} from "../auditLogsConstants";
import { formatDateTime } from "../../../../utils/format";

function Row({ label, value, dir, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>

      <dd
        dir={dir}
        className={`min-w-0 break-words text-end text-[13.5px] font-medium text-ink-soft ${
          mono ? "tnum" : ""
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

/** Copying a GUID out of a modal beats selecting it by hand. */
function CopyableId({ value }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => {
            setCopied(true);

            setTimeout(() => setCopied(false), 1500);
          },
          () => {}
        );
      }}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-brand-50"
    >
      <span dir="ltr" className="tnum text-[12.5px]">
        {value}
      </span>

      {copied ? (
        <Check size={13} aria-hidden="true" className="shrink-0 text-emerald-600" />
      ) : (
        <Copy size={13} aria-hidden="true" className="shrink-0 text-muted" />
      )}

      <span className="sr-only">نسخ المعرّف</span>
    </button>
  );
}

/** A short label renders inline; a parsed object gets its own folded block. */
function ValueBlock({ label, value, tone }) {
  const parsed = parseAuditValue(value);

  const [isOpen, setIsOpen] = useState(false);

  if (parsed.kind === "empty") {
    return (
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[12px] font-semibold text-muted">{label}</p>

        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
          <Minus size={13} aria-hidden="true" />
          لا توجد قيمة
        </span>
      </div>
    );
  }

  if (parsed.kind === "text") {
    return (
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[12px] font-semibold text-muted">{label}</p>

        <span
          className={`inline-block max-w-full break-words rounded-lg px-2.5 py-1.5 text-[13.5px] font-semibold ring-1 ring-inset ${tone}`}
        >
          {parsed.value}
        </span>
      </div>
    );
  }

  const json = JSON.stringify(parsed.value, null, 2);

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 text-[12px] font-semibold text-muted">{label}</p>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="w-full cursor-pointer rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-start text-[12.5px] font-semibold text-ink-soft transition-colors hover:bg-brand-50"
      >
        {isOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}
      </button>

      {isOpen && (
        <pre
          dir="ltr"
          className="mt-2 max-h-64 overflow-auto rounded-lg border border-line bg-brand-950 p-3 text-start text-[11.5px] leading-5 text-brand-100"
        >
          {json}
        </pre>
      )}
    </div>
  );
}

export default function AdminAuditDetails({ open, onClose, query }) {
  const entry = query.data?.data;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تفاصيل العملية"
      description={entry?.actionName || undefined}
      size="md"
    >
      {query.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : query.isError ? (
        <ErrorState
          title="تعذّر تحميل تفاصيل العملية"
          description="حدث خطأ أثناء جلب هذه العملية. حاول مرة أخرى."
          onRetry={query.refetch}
        />
      ) : !entry ? null : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${actionTone(
                entry.actionName
              )}`}
            >
              {entry.actionName || "—"}
            </span>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${targetTone(
                entry.targetType
              )}`}
            >
              {entry.targetTypeName || entry.targetType || "—"}
            </span>
          </div>

          <p className="mt-3 text-[15px] font-semibold leading-7 text-ink">
            {entry.description || "—"}
          </p>

          {/* --------------------- before / after --------------------- */}
          {entry.hasChange ? (
            <section className="mt-5 rounded-2xl border border-line bg-canvas p-3.5">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-ink-soft">
                <ArrowLeftRight size={15} aria-hidden="true" />
                التغيير
              </h3>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <ValueBlock
                  label="القيمة السابقة"
                  value={entry.oldValue}
                  tone="bg-red-50 text-red-700 ring-red-200"
                />

                <ValueBlock
                  label="القيمة الجديدة"
                  value={entry.newValue}
                  tone="bg-emerald-50 text-emerald-700 ring-emerald-200"
                />
              </div>
            </section>
          ) : (
            <p className="mt-5 rounded-2xl border border-line bg-canvas px-3.5 py-3 text-[13px] text-muted">
              لم تُسجَّل قيم قبل/بعد لهذه العملية.
            </p>
          )}

          {/* ------------------------- details ------------------------ */}
          <dl className="mt-5">
            <Row label="المسؤول" value={entry.adminName} />

            <Row label="التاريخ والوقت" value={formatDateTime(entry.createdAt)} mono />

            <Row
              label="معرّف العنصر"
              value={<CopyableId value={entry.targetId} />}
              dir="ltr"
            />

            {/* Present only when the server recorded one. */}
            {entry.ipAddress && (
              <Row
                label="عنوان IP"
                dir="ltr"
                mono
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Globe size={13} aria-hidden="true" className="text-muted" />
                    {entry.ipAddress}
                  </span>
                }
              />
            )}
          </dl>
        </>
      )}
    </Modal>
  );
}
