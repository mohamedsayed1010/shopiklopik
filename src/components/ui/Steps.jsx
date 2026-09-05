import { Check } from "lucide-react";

export default function Steps({ steps = [], current = 0, className = "" }) {
  return (
    <ol className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {steps.map((label, index) => {
        const isDone = index < current;
        const isCurrent = index === current;

        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                isDone
                  ? "bg-brand-900 text-white"
                  : isCurrent
                    ? "bg-gold-300 text-brand-900"
                    : "bg-brand-100 text-brand-400"
              }`}
            >
              {isDone ? <Check size={14} strokeWidth={3} /> : index + 1}
            </span>

            <span
              className={`truncate text-xs font-medium sm:text-sm ${
                isCurrent ? "text-ink" : "text-muted"
              }`}
            >
              {label}
            </span>

            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`hidden h-px flex-1 sm:block ${
                  isDone ? "bg-brand-900" : "bg-line"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
