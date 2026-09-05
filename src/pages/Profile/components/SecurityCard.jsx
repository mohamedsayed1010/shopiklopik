import { KeyRound, Lock, ShieldCheck } from "lucide-react";

import Button from "../../../components/ui/Button";

export default function SecurityCard({ onChangePassword }) {
  return (
    <section className="glass relative overflow-hidden rounded-3xl border border-line p-5 shadow-sm">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 h-40 w-40 rounded-full bg-brand-200/35 blur-3xl end-[-2rem]"
      />

      <div className="relative">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 text-gold-300 shadow-sm">
          <ShieldCheck size={20} strokeWidth={1.9} aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-[15px] font-bold text-ink">أمان الحساب</h2>

        <p className="mt-1.5 text-[13px] leading-6 text-muted">
          غيّر كلمة المرور بانتظام، ولا تشاركها مع أي شخص. لن يطلبها منك فريق
          شوبيك لوبيك أبدًا.
        </p>

        <ul className="mt-4 space-y-2">
          {[
            "استخدم كلمة مرور طويلة وفريدة",
            "لا تعيد استخدام كلمة مرور موقع آخر",
          ].map((hint) => (
            <li
              key={hint}
              className="flex items-start gap-2 text-[12.5px] leading-6 text-ink-soft"
            >
              <Lock
                size={13}
                aria-hidden="true"
                className="mt-1.5 shrink-0 text-brand-300"
              />
              {hint}
            </li>
          ))}
        </ul>

        <Button
          variant="outline"
          fullWidth
          className="mt-5"
          onClick={onChangePassword}
        >
          <KeyRound size={16} />
          تغيير كلمة المرور
        </Button>
      </div>
    </section>
  );
}
