import { Moon, Sun } from "lucide-react";

import useTheme from "../../hooks/useTheme";

export default function ThemeToggle({ variant = "icon", onToggled }) {
  const { isDark, toggle } = useTheme();

  const label = isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن";

  const Icon = isDark ? Sun : Moon;

  const handleClick = () => {
    toggle();

    onToggled?.();
  };

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isDark}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-brand-50 hover:text-brand-900"
      >
        <Icon size={19} strokeWidth={1.9} className="shrink-0 text-brand-400" />

        <span>{isDark ? "الوضع الفاتح" : "الوضع الداكن"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white transition-[background-color,transform] duration-200 hover:bg-white/10 active:scale-95"
    >
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
