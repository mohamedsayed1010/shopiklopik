export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  busy = false,
  label,
  size = "md",
  className = "",
}) {
  const isSmall = size === "sm";

  const track = isSmall ? "h-5 w-9" : "h-6 w-11";
  const knob = isSmall ? "h-3.5 w-3.5 top-[3px]" : "h-4 w-4 top-1";
  const knobOn = isSmall ? "start-[1.125rem]" : "start-6";
  const knobOff = isSmall ? "start-[3px]" : "start-1";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onChange?.(!checked)}
      className={`relative shrink-0 rounded-full transition-colors duration-200 ${track} ${
        checked ? "bg-brand-900" : "bg-line-strong"
      } ${
        disabled || busy
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute rounded-full bg-white shadow-sm transition-all duration-200 ${knob} ${
          checked ? knobOn : knobOff
        }`}
      />
    </button>
  );
}
