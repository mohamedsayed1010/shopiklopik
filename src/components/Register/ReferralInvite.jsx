import { BadgeCheck, Gift, Loader2, TriangleAlert } from "lucide-react";

import { labelClass, inputClass } from "../ui/formStyles";
import { useResolveReferral } from "../../hooks/useReferrals";

export default function ReferralInvite({ formik }) {
  const code = formik.values.referralCode ?? "";

  const { resolutionQuery, resolution } = useResolveReferral({ code });

  const isChecking = resolutionQuery.isFetching;

  return (
    <div className="sm:col-span-2">
      <label htmlFor="referralCode" className={labelClass}>
        كود الدعوة{" "}
        <span className="font-normal text-muted">(اختياري)</span>
      </label>

      <div className="relative">
        <Gift
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
        />

        <input
          id="referralCode"
          name="referralCode"
          type="text"
          dir="ltr"
          value={code}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="ABC123"
          autoComplete="off"
          className={`${inputClass()} ps-11`}
        />

        {isChecking && (
          <Loader2
            size={18}
            aria-hidden="true"
            className="absolute top-1/2 -translate-y-1/2 animate-spin text-muted end-4"
          />
        )}
      </div>

      {/* Nothing is claimed until the server has answered. */}
      {!isChecking && code.trim() && resolution && (
        <div
          className={`mt-3 flex items-start gap-3 rounded-2xl border px-4 py-3 ${
            resolution.valid
              ? "border-emerald-200 bg-emerald-50/70"
              : "border-amber-200 bg-amber-50/70"
          }`}
        >
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              resolution.valid
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {resolution.valid ? (
              <BadgeCheck size={17} aria-hidden="true" />
            ) : (
              <TriangleAlert size={17} aria-hidden="true" />
            )}
          </span>

          <div className="min-w-0">
            {resolution.valid ? (
              <>
                <p className="text-sm font-bold text-ink">
                  دعاك: {resolution.referrerName || "—"}
                </p>

                <p dir="ltr" className="mt-0.5 text-start text-[12px] text-muted">
                  {resolution.referralCode || code}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-ink">
                {resolution.message || "رابط الدعوة غير صالح."}
              </p>
            )}

            {resolution.valid && resolution.message && (
              <p className="mt-1 text-[12px] leading-6 text-muted">
                {resolution.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* A failed *request* is different from an invalid code, and says so. */}
      {resolutionQuery.isError && (
        <p className="mt-2 text-[12px] text-muted">
          تعذّر التحقق من كود الدعوة الآن. يمكنك متابعة إنشاء الحساب.
        </p>
      )}
    </div>
  );
}
