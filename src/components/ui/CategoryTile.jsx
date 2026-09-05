import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import getCategoryTheme, { categoryVars } from "../../theme/categoryTheme";

export default function CategoryTile({ to, icon, title, subtitle }) {
  const theme = getCategoryTheme(title);

  const Icon = icon ?? theme.icon;

  return (
    <Link
      to={to}
      style={categoryVars(theme)}
      className="accent-tile group relative isolate flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface p-4 shadow-xs transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1 sm:rounded-3xl sm:p-5"
    >
      {/* Accent wash — barely there at rest, blooms from the top corner on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(130% 100% at 100% 0%, var(--accent-soft) 0%, transparent 62%)",
        }}
      />

      {/* Oversized watermark: the category reads even before the label does. */}
      <Icon
        aria-hidden="true"
        strokeWidth={1}
        className="pointer-events-none absolute -bottom-5 -z-10 h-24 w-24 text-[color:var(--accent)] opacity-[0.06] transition-[opacity,transform] duration-500 ease-out group-hover:scale-110 group-hover:opacity-[0.11] start-[-1rem]"
      />

      {/* Accent hairline that only shows on hover — keeps the resting grid calm. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[20px] border border-[color:var(--accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-30 sm:rounded-3xl"
      />

      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 ease-out group-hover:scale-[1.06] sm:h-16 sm:w-16">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl transition-opacity duration-300 group-hover:opacity-0"
          style={{ backgroundColor: "var(--accent-soft)" }}
        />

        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(145deg, rgba(255,255,255,.22), rgba(0,0,0,.16))",
            backgroundColor: "var(--accent)",
            boxShadow: "0 8px 18px -6px var(--accent)",
          }}
        />

        <Icon
          size={27}
          strokeWidth={1.7}
          className="relative text-[color:var(--accent)] transition-colors duration-300 group-hover:text-white"
        />
      </span>

      <h3 className="mt-4 line-clamp-2 text-[15px] font-semibold leading-6 text-ink sm:text-base">
        {title}
      </h3>

      {subtitle && (
        <p className="mt-1.5 text-xs font-medium text-muted transition-colors duration-300 group-hover:text-[color:var(--accent)]">
          {subtitle}
        </p>
      )}

      {/* Directional cue, revealed on intent rather than shouting at rest. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-4 flex h-7 w-7 scale-75 items-center justify-center rounded-full bg-[color:var(--accent)] text-white opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 end-4"
      >
        <ArrowLeft size={14} strokeWidth={2.4} />
      </span>
    </Link>
  );
}
