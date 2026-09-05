import { Radio } from "lucide-react";

import {
  bannerPaymentTone,
  bannerStatusTone,
} from "../../../../utils/bannerModel";

export default function BannerStatusBadge({
  status,
  statusName,
  kind = "booking",
  size = "md",
  className = "",
}) {
  const label = statusName || (status != null ? `#${status}` : "—");

  const scale =
    size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[12px]";

  const tone =
    kind === "payment" ? bannerPaymentTone(status) : bannerStatusTone(status);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold ring-1 ring-inset ${scale} ${tone} ${className}`}
    >
      {label}
    </span>
  );
}

/** The "on air" marker, shown only when the server says `isLive`. */
export function LiveBadge({ size = "md", className = "" }) {
  const scale =
    size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[12px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 font-bold text-white ${scale} ${className}`}
    >
      <Radio size={11} strokeWidth={2.6} aria-hidden="true" />
      LIVE
    </span>
  );
}
