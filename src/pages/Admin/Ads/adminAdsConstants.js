import {
  Ban,
  CheckCircle2,
  Clock,
  LayoutList,
  TimerOff,
  XCircle,
} from "lucide-react";

/** Verified against `/ads/metadata`, which names all four. */
export const MODERATION_STATUS = {
  pending: 0,
  approved: 1,
  rejected: 2,
  suspended: 3,
};

/** Verified by query; 3 and 4 exist in the enum but are unconfirmed. */
export const LISTING_STATUS = {
  pending: 0,
  active: 1,
  expired: 2,
};

export const ADMIN_ADS_TABS = [
  {
    key: "all",
    label: "كل الإعلانات",
    icon: LayoutList,
    endpoint: "all",
    filters: {},
  },
  {
    key: "pending",
    label: "قيد المراجعة",
    icon: Clock,
    endpoint: "pending",
    filters: {},
    // The badge on this tab is the authoritative count, not a page total.
    showsPendingBadge: true,
  },
  {
    key: "active",
    label: "النشطة",
    icon: CheckCircle2,
    endpoint: "all",
    filters: { status: LISTING_STATUS.active },
  },
  {
    key: "rejected",
    label: "المرفوضة",
    icon: XCircle,
    endpoint: "all",
    filters: { moderationStatus: MODERATION_STATUS.rejected },
  },
  {
    key: "suspended",
    label: "الموقوفة",
    icon: Ban,
    endpoint: "all",
    filters: { moderationStatus: MODERATION_STATUS.suspended },
  },
  {
    key: "expired",
    label: "المنتهية",
    icon: TimerOff,
    endpoint: "all",
    filters: { status: LISTING_STATUS.expired },
  },
];

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

const BADGE_TONES = {
  pending: "bg-gold-50 text-gold-700 ring-gold-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  suspended: "bg-orange-50 text-orange-700 ring-orange-200",
  expired: "bg-slate-100 text-slate-600 ring-slate-300",
  draft: "bg-slate-100 text-slate-600 ring-slate-300",
};

const NEUTRAL_TONE = "bg-brand-50 text-brand-700 ring-brand-200";

export function badgeTone(status) {
  return BADGE_TONES[String(status ?? "").toLowerCase()] ?? NEUTRAL_TONE;
}

const STATUS_AR = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  active: "نشط",
  rejected: "مرفوض",
  suspended: "موقوف",
  expired: "منتهي",
  draft: "مسودة",
};

export function statusLabel(status) {
  if (!status) return "—";

  return STATUS_AR[String(status).toLowerCase()] ?? String(status);
}
