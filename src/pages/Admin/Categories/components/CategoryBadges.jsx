const PILL =
  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset";

export function ActiveBadge({ active }) {
  return (
    <span
      className={`${PILL} ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-300"
      }`}
    >
      {active ? "مفعّل" : "معطّل"}
    </span>
  );
}

export function SystemBadge() {
  return (
    <span
      className={`${PILL} bg-brand-50 text-brand-700 ring-brand-200`}
      title="قسم أساسي في النظام"
    >
      نظام
    </span>
  );
}
