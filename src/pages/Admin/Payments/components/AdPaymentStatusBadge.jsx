/* The server's own status name, in a neutral tone. The meaning of each status
   number is not published for ad payments, so no colour implies success or
   failure that the server did not state. */
export default function AdPaymentStatusBadge({ status, statusName, size = "sm" }) {
  const label =
    (typeof statusName === "string" && statusName.trim()) ||
    (status !== null && status !== undefined ? `الحالة ${status}` : "—");

  const scale = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]";

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center truncate rounded-full bg-canvas font-semibold text-ink-soft ring-1 ring-inset ring-line-strong ${scale}`}
    >
      {label}
    </span>
  );
}
