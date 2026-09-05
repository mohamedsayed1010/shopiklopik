import { AlertTriangle, RotateCw } from "lucide-react";

import Button from "./Button";

export default function ErrorState({
  title = "تعذّر تحميل البيانات",
  description = "حدث خطأ غير متوقع. تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.",
  onRetry,
  className = "",
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center ${className}`}
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-breathe rounded-full bg-red-100/70 blur-xl"
        />

        <span
          aria-hidden="true"
          className="absolute inset-0 animate-slow-spin rounded-full border border-dashed border-red-200"
        />

        <span
          aria-hidden="true"
          className="absolute inset-4 rounded-full bg-gradient-to-br from-red-50 to-red-100"
        />

        <AlertTriangle
          size={32}
          strokeWidth={1.6}
          aria-hidden="true"
          className="relative text-red-600"
        />
      </div>

      <h3 className="mt-6 text-lg font-bold text-ink">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">{description}</p>

      {onRetry && (
        <Button variant="outline" className="mt-7" onClick={onRetry}>
          <RotateCw size={16} />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
