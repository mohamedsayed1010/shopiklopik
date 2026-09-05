import { Ban, Check, Eye, Trash2, X } from "lucide-react";

const BASE =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-[background-color,color] duration-200 disabled:cursor-not-allowed disabled:opacity-40";

export default function AdminAdRowActions({ ad, onDetails, onAction, disabled }) {
  const moderation = String(ad?.moderation?.status ?? "").toLowerCase();

  const canApprove = moderation !== "approved";

  const canReject = moderation !== "rejected";

  const canSuspend = moderation === "approved";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onDetails(ad)}
        disabled={disabled}
        aria-label={`عرض تفاصيل ${ad.title ?? "الإعلان"}`}
        title="التفاصيل"
        className={`${BASE} text-brand-600 hover:bg-brand-50 hover:text-brand-900`}
      >
        <Eye size={16} />
      </button>

      {canApprove && (
        <button
          type="button"
          onClick={() => onAction("approve", ad)}
          disabled={disabled}
          aria-label={`الموافقة على ${ad.title ?? "الإعلان"}`}
          title="موافقة"
          className={`${BASE} text-emerald-600 hover:bg-emerald-50`}
        >
          <Check size={16} />
        </button>
      )}

      {canReject && (
        <button
          type="button"
          onClick={() => onAction("reject", ad)}
          disabled={disabled}
          aria-label={`رفض ${ad.title ?? "الإعلان"}`}
          title="رفض"
          className={`${BASE} text-red-600 hover:bg-red-50`}
        >
          <X size={16} />
        </button>
      )}

      {canSuspend && (
        <button
          type="button"
          onClick={() => onAction("suspend", ad)}
          disabled={disabled}
          aria-label={`إيقاف ${ad.title ?? "الإعلان"}`}
          title="إيقاف"
          className={`${BASE} text-orange-600 hover:bg-orange-50`}
        >
          <Ban size={16} />
        </button>
      )}

      <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-line" />

      <button
        type="button"
        onClick={() => onAction("delete", ad)}
        disabled={disabled}
        aria-label={`حذف ${ad.title ?? "الإعلان"}`}
        title="حذف"
        className={`${BASE} text-muted hover:bg-red-50 hover:text-red-600`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
