import { Ban, CheckCircle2, Trash2 } from "lucide-react";

export const REPORT_ACTIONS = [
  {
    id: 0,
    label: "إغلاق البلاغ دون تغيير الإعلان",
    description: "يُسجَّل البلاغ كمُعالَج، ويبقى الإعلان منشورًا كما هو.",
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    severity: 0,
  },
  {
    id: 1,
    label: "إيقاف الإعلان",
    description: "يُخفى الإعلان عن المستخدمين، وتُحفظ ملاحظتك في سجل مراجعته.",
    icon: Ban,
    tone: "bg-orange-50 text-orange-700 ring-orange-200",
    severity: 1,
  },
  {
    id: 2,
    label: "حذف الإعلان نهائيًا",
    description: "يُحذف الإعلان ولا يمكن التراجع عن ذلك.",
    icon: Trash2,
    tone: "bg-red-50 text-red-700 ring-red-200",
    severity: 2,
  },
];

/** Anything above this warrants a second confirmation step. */
export const DESTRUCTIVE_SEVERITY = 1;

export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function reportStatusTone(statusName) {
  const name = String(statusName ?? "");

  if (/قيد المراجعة|جديد/.test(name)) {
    return "bg-gold-50 text-gold-700 ring-gold-200";
  }

  if (/جاري|قيد الفحص/.test(name)) {
    return "bg-sky-50 text-sky-700 ring-sky-200";
  }

  if (/اتخاذ إجراء|تم/.test(name)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (/مرفوض|تجاهل/.test(name)) return "bg-slate-100 text-slate-600 ring-slate-300";

  return "bg-canvas text-ink-soft ring-line-strong";
}

export function isOpenStatus(statusName) {
  return /قيد المراجعة|جاري|قيد الفحص|جديد/.test(String(statusName ?? ""));
}

/** Reason severity is not published either; only "أخرى" is de-emphasised. */
export function reasonTone(reasonName) {
  return /أخرى/.test(String(reasonName ?? ""))
    ? "bg-canvas text-ink-soft ring-line-strong"
    : "bg-brand-50 text-brand-700 ring-brand-200";
}
