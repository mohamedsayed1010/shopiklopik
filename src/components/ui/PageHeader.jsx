import BackButton from "./BackButton";

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
  showBack = true,
  className = "",
}) {
  return (
    <div className={className}>
      {/* The same control the admin screens use — see `BackButton`. */}
      {showBack && <BackButton />}

      {(title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1.5 text-sm font-medium text-gold-600">
                {eyebrow}
              </p>
            )}

            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="mt-2 text-sm leading-6 text-muted sm:text-[15px]">
                {subtitle}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </div>
  );
}
