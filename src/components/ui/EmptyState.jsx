import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "لا توجد نتائج",
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center ${className}`}
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-breathe rounded-full bg-brand-100/60 blur-xl"
        />

        <span
          aria-hidden="true"
          className="absolute inset-0 animate-slow-spin rounded-full border border-dashed border-brand-200"
        />

        <span
          aria-hidden="true"
          className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-50 to-brand-100"
        />

        <Icon
          size={34}
          strokeWidth={1.5}
          aria-hidden="true"
          className="relative text-brand-500"
        />
      </div>

      <h3 className="mt-6 text-lg font-bold text-ink">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
          {description}
        </p>
      )}

      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
