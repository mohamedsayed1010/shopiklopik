
const TONES = {
  default: {
    card: "border-line",
    icon: "bg-brand-50 text-brand-700 ring-brand-100",
  },
  warning: {
    card: "border-gold-300 ring-1 ring-gold-200",
    icon: "bg-gold-50 text-gold-700 ring-gold-200",
  },
};

export default function SettingsSection({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  children,
  className = "",
}) {
  const palette = TONES[tone] ?? TONES.default;

  return (
    <section
      className={`rounded-3xl border bg-surface p-5 shadow-xs sm:p-6 ${palette.card} ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ${palette.icon}`}
            >
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
          )}

          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-ink sm:text-base">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-[13px] leading-6 text-muted">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}
