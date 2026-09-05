
const STATUSES = {
  active: {
    label: "نشط",
    className: "bg-green-50 text-green-700 ring-green-600/20",
    dot: "bg-green-500",
  },
  pending: {
    label: "قيد المراجعة",
    className: "bg-gold-50 text-gold-700 ring-gold-500/25",
    dot: "bg-gold-400",
  },
  expired: {
    label: "منتهي",
    className: "bg-brand-50 text-brand-600 ring-brand-500/20",
    dot: "bg-brand-300",
  },
  rejected: {
    label: "مرفوض",
    className: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
  deleted: {
    label: "محذوف",
    className: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-400",
  },
  inactive: {
    label: "غير نشط",
    className: "bg-brand-50 text-brand-600 ring-brand-500/20",
    dot: "bg-brand-300",
  },
};

const NEUTRAL = {
  className: "bg-brand-50 text-brand-600 ring-brand-500/20",
  dot: "bg-brand-300",
};

export function describeStatus(status) {
  const key = String(status ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  const known = STATUSES[key];

  if (known) return known;

  return {
    label: String(status ?? "").trim() || "غير معروف",
    ...NEUTRAL,
  };
}

export default describeStatus;
