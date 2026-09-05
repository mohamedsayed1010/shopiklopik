import { paymentStatusTone } from "../../utils/paymentMethodFields";

export default function PaymentStatusBadge({
  status,
  statusName,
  size = "md",
  className = "",
}) {
  const label = statusName || (status != null ? `#${status}` : "—");

  const scale =
    size === "sm"
      ? "px-2 py-0.5 text-[11px]"
      : "px-2.5 py-1 text-[12px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold ring-1 ring-inset ${scale} ${paymentStatusTone(
        status
      )} ${className}`}
    >
      {label}
    </span>
  );
}
