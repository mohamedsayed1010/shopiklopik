import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import getCategoryTheme, { categoryVars } from "../../theme/categoryTheme";

export default function LinkTile({ to, title, subtitle, accentFrom }) {
  const theme = getCategoryTheme(accentFrom ?? title);

  const Icon = theme.icon;

  return (
    <Link
      to={to}
      style={categoryVars(theme)}
      className="accent-tile group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-xs transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl border border-[color:var(--accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-30"
      />

      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:scale-105">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-xl transition-opacity duration-300 group-hover:opacity-0"
          style={{ backgroundColor: "var(--accent-soft)" }}
        />

        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(145deg, rgba(255,255,255,.22), rgba(0,0,0,.16))",
            backgroundColor: "var(--accent)",
          }}
        />

        <Icon
          size={21}
          strokeWidth={1.8}
          className="relative text-[color:var(--accent)] transition-colors duration-300 group-hover:text-white"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-6 text-ink">
          {title}
        </span>

        {subtitle && (
          <span className="mt-0.5 block truncate text-xs text-muted">
            {subtitle}
          </span>
        )}
      </span>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-muted transition-[background-color,color,transform] duration-300 group-hover:-translate-x-0.5 group-hover:bg-[color:var(--accent)] group-hover:text-white">
        <ChevronLeft size={17} strokeWidth={2.2} />
      </span>
    </Link>
  );
}
