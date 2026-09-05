import { Link } from "react-router-dom";

import mark from "../../assets/logo-mark.png";
import { APP_NAME } from "../../utils/brand";

const [BRAND_LEAD, ...BRAND_TAIL] = APP_NAME.split(" ");

const BRAND_ACCENT = BRAND_TAIL.join(" ");

const MARK_PLATE = {
  light: "rounded-xl bg-white/5 ring-1 ring-gold-300/25",
  dark: "rounded-xl bg-brand-50 ring-1 ring-brand-900/10",
};

const SIZES = {
  sm: {
    mark: "h-8 w-8",
    word: "text-[17px]",
    tagline: "text-[10px]",
    gap: "gap-2",
  },
  md: {
    mark: "h-9 w-9 sm:h-10 sm:w-10",
    word: "text-lg sm:text-xl",
    tagline: "text-[10px] sm:text-[11px]",
    gap: "gap-2.5",
  },
  lg: {
    mark: "h-12 w-12",
    word: "text-2xl",
    tagline: "text-xs",
    gap: "gap-3",
  },
  xl: {
    mark: "h-14 w-14",
    word: "text-[28px]",
    tagline: "text-xs",
    gap: "gap-3.5",
  },
};

export default function Logo({
  size = "md",
  tone = "light",
  to = "/",
  tagline = false,
  src,
  /** The wordmark, when the site has been renamed in the settings. */
  name,
  className = "",
}) {
  const scale = SIZES[size] ?? SIZES.md;

  const isLight = tone === "light";

  const content = (
    <>
      <img
        src={src || mark}
        alt=""
        width={192}
        height={192}
        // Eager: the logo is above the fold on every screen and a late-loading
        // logo is the clearest possible "unfinished" signal.
        loading="eager"
        decoding="async"
        className={`${scale.mark} ${
          isLight ? MARK_PLATE.light : MARK_PLATE.dark
        } shrink-0 object-contain`}
      />

      <span className="flex min-w-0 flex-col">
        <span
          className={`${scale.word} font-bold leading-tight tracking-tight`}
        >
          {name ? (
            /* A configured name is one string and cannot be split into the
               two-tone lockup, so it takes the primary colour whole. */
            <span className={isLight ? "text-white" : "text-brand-900"}>
              {name}
            </span>
          ) : (
            <>
              <span className={isLight ? "text-white" : "text-brand-900"}>
                {BRAND_LEAD}
              </span>
              <span className={isLight ? "text-gold-300" : "text-gold-500"}>
                &nbsp;{BRAND_ACCENT}
              </span>
            </>
          )}
        </span>

        {tagline && (
          <span
            className={`${scale.tagline} mt-0.5 font-medium tracking-wide ${
              isLight ? "text-brand-300" : "text-muted"
            }`}
          >
            سوق الفيوم الإلكتروني
          </span>
        )}
      </span>
    </>
  );

  const base = `flex shrink-0 items-center ${scale.gap} ${className}`;

  if (!to) {
    return <span className={base}>{content}</span>;
  }

  return (
    <Link to={to} aria-label="شوبيك لوبيك - الصفحة الرئيسية" className={base}>
      {content}
    </Link>
  );
}

export function LogoMark({ className = "h-12 w-12", tone = "dark" }) {
  return (
    <img
      src={mark}
      alt={APP_NAME}
      width={192}
      height={192}
      loading="eager"
      decoding="async"
      className={`${className} ${
        tone === "light" ? MARK_PLATE.light : MARK_PLATE.dark
      } shrink-0 object-contain`}
    />
  );
}
