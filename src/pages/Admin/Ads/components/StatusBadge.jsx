import { badgeTone, statusLabel } from "../adminAdsConstants";

export default function StatusBadge({ status, label, size = "md" }) {
  if (!status && !label) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${badgeTone(
        status
      )} ${size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
      />
      {label || statusLabel(status)}
    </span>
  );
}
