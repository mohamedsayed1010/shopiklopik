import { useState } from "react";
import { Check, Copy, Info } from "lucide-react";

import { paymentDestinationRows } from "../../utils/paymentMethodFields";

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));

      setCopied(true);

      // Reverts on its own; a permanent check mark would claim more than it
      // knows the next time the same value is shown.
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard denied (insecure origin, or the user said no). The value is
         on screen and selectable, so there is nothing to report. */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`نسخ ${label}`}
      className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700"
    >
      {copied ? (
        <Check size={15} className="text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy size={15} aria-hidden="true" />
      )}
    </button>
  );
}

export default function PaymentMethodInfo({
  method,
  showInstructions = true,
  className = "",
}) {
  const rows = paymentDestinationRows(method);

  const instructions = method?.instructions?.trim();

  if (!rows.length && !(showInstructions && instructions)) return null;

  return (
    <div className={className}>
      {rows.length > 0 && (
        <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5"
            >
              <dt className="shrink-0 text-[12.5px] text-muted">{row.label}</dt>

              <dd className="flex min-w-0 items-center gap-1">
                <span
                  dir={row.ltr ? "ltr" : undefined}
                  className={`truncate text-[13.5px] font-semibold text-ink ${
                    row.ltr ? "tnum" : ""
                  }`}
                >
                  {row.value}
                </span>

                {row.copyable && (
                  <CopyButton value={row.value} label={row.label} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {showInstructions && instructions && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-[12.5px] leading-6 text-ink-soft">
          <Info
            size={15}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-brand-500"
          />
          <span className="whitespace-pre-line">{instructions}</span>
        </p>
      )}
    </div>
  );
}
