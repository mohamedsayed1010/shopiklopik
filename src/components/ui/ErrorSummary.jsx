import { CircleAlert } from "lucide-react";

export default function ErrorSummary({
  messages = [],
  title = "تعذّر إتمام العملية",
  className = "",
}) {
  if (!Array.isArray(messages) || messages.length === 0) return null;

  return (
    <div
      role="alert"
      /* Focus target for the caller that scrolls here on submit. */
      tabIndex={-1}
      className={`rounded-2xl border border-red-200 bg-red-50 p-4 outline-none ${className}`}
    >
      <p className="flex items-center gap-2 text-[14px] font-bold text-red-700">
        <CircleAlert size={17} strokeWidth={2.2} aria-hidden="true" />
        {title}
      </p>

      <ul className="mt-2.5 space-y-1.5 ps-1">
        {messages.map((message) => (
          <li
            key={message}
            className="flex gap-2 text-[13.5px] leading-6 text-red-800 [overflow-wrap:anywhere]"
          >
            <span aria-hidden="true" className="select-none opacity-60">
              •
            </span>
            <span>{message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
