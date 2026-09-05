import { forwardRef } from "react";


const VARIANTS = {
  primary:
    "bg-brand-900 text-white hover:bg-brand-800 active:bg-brand-950 shadow-xs hover:shadow-md",
  gold: "bg-gold-300 text-brand-900 hover:bg-gold-400 active:bg-gold-500 shadow-xs hover:shadow-md",
  outline:
    "bg-surface text-ink border border-line-strong hover:bg-brand-50 hover:border-brand-200 active:bg-brand-100",
  ghost: "bg-transparent text-ink-soft hover:bg-brand-50 hover:text-brand-900",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs",
  // Destructive, but tertiary — a filled red button next to "view" and
  // "republish" would read as the primary thing to do on the row.
  "danger-ghost":
    "bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100",
  // Recognisable without shouting: green outline that fills on intent.
  whatsapp:
    "bg-surface text-[#128C4A] border border-[#128C4A]/30 hover:bg-[#25D366] hover:border-[#25D366] hover:text-white active:bg-[#128C4A]",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-[15px] gap-2 rounded-xl",
  lg: "h-13 px-6 text-base gap-2.5 rounded-xl",
};

const Button = forwardRef(function Button(
  {
    as: Component = "button",
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    fullWidth = false,
    className = "",
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      disabled={Component === "button" ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={[
        "inline-flex items-center justify-center font-semibold",
        "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out select-none",
        // A small give on press makes every action feel physical.
        "active:scale-[.97]",
        "disabled:pointer-events-none disabled:opacity-50",
        isDisabled ? "pointer-events-none opacity-50" : "cursor-pointer",
        fullWidth ? "w-full" : "",
        SIZES[size],
        VARIANTS[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </Component>
  );
});

export default Button;
