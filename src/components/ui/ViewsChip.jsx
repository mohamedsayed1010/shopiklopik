import { Eye } from "lucide-react";

import { formatNumber } from "../../utils/format";

const VARIANTS = {
  /* The card's meta row, under the title, beside location and time. */
  meta: {
    wrapper: "tnum ms-auto flex shrink-0 items-center gap-1",
    iconSize: 13,
    strokeWidth: 2,
    iconClass: "text-brand-300",
  },

  /* Over the photo in the hover preview, sitting on a dark scrim. */
  overlay: {
    wrapper:
      "tnum absolute bottom-3 flex items-center gap-1.5 rounded-full bg-brand-950/60 px-2.5 py-1.5 text-[11.5px] font-semibold text-white backdrop-blur-sm end-3",
    iconSize: 12,
    strokeWidth: 2.3,
    iconClass: "",
  },
};

const UNKNOWN_LABEL = "عدد المشاهدات غير متاح بعد";

export default function ViewsChip({ value, variant = "meta", className = "" }) {
  const style = VARIANTS[variant] ?? VARIANTS.meta;

  const count = Number(value);

  const isKnown =
    value !== null && value !== undefined && value !== "" && Number.isFinite(count);

  return (
    <span
      className={`${style.wrapper} ${isKnown ? "" : "opacity-60"} ${className}`}
      title={isKnown ? undefined : UNKNOWN_LABEL}
    >
      <Eye
        size={style.iconSize}
        strokeWidth={style.strokeWidth}
        className={style.iconClass}
        aria-hidden="true"
      />

      {isKnown ? formatNumber(count) : <span aria-hidden="true">—</span>}

      <span className="sr-only">{isKnown ? "مشاهدة" : UNKNOWN_LABEL}</span>
    </span>
  );
}
