import { Clock } from "lucide-react";

/**
 * Shown to the owner on their own listing while it is in review. The label is
 * the server's own status name (`advertisementModerationStatusName`, the same
 * words My Listings shows) — never derived from the address or how the page was
 * reached. What it says about visibility was verified in production: a pending
 * listing answers 404 to anyone but its owner and is absent from every public
 * list and search.
 */
export default function ModerationNotice({ statusName }) {
  if (!statusName) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
    >
      <Clock size={18} aria-hidden="true" className="mt-0.5 shrink-0" />

      <div className="min-w-0">
        <p className="text-[14px] font-bold leading-6">
          حالة الإعلان: <span className="rounded-md bg-amber-100 px-1.5 py-0.5">{statusName}</span>
        </p>

        <p className="mt-0.5 text-[13px] leading-6">
          الإعلان ظاهر لك وحدك الآن، ولن يظهر للزوار أو في نتائج البحث قبل موافقة الإدارة.
        </p>
      </div>
    </div>
  );
}
