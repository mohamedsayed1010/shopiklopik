export default function Panel({
  as: Component = "section",
  title,
  icon: Icon,
  action,
  padded = true,
  className = "",
  bodyClassName = "",
  children,
  ...props
}) {
  return (
    <Component
      className={`relative overflow-hidden rounded-[26px] border border-white/70 glass shadow-md ring-1 ring-line/70 ${className}`}
      {...props}
    >
      {/* The glass edge catching light. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
      />

      {title && (
        <header className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-4 sm:px-7 sm:py-5">
          <h2 className="flex items-center gap-3 text-[15px] font-bold text-ink sm:text-base">
            {Icon ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
                <Icon size={17} strokeWidth={2.1} />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="h-5 w-1 shrink-0 rounded-full bg-gradient-to-b from-gold-300 to-gold-500"
              />
            )}

            {title}
          </h2>

          {action}
        </header>
      )}

      <div
        className={`${padded ? "px-5 py-5 sm:px-7 sm:py-6" : ""} ${bodyClassName}`}
      >
        {children}
      </div>
    </Component>
  );
}
