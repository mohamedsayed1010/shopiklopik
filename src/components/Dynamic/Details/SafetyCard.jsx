import { Banknote, Eye, MapPinned, ShieldCheck } from "lucide-react";

const TIPS = [
  {
    icon: MapPinned,
    title: "قابل البائع في مكان عام",
    text: "اختر مكاناً مزدحماً ونهاراً، ويفضّل اصطحاب شخص معك.",
  },
  {
    icon: Eye,
    title: "عايِن قبل الدفع",
    text: "افحص المنتج جيداً وتأكد من مطابقته للصور والوصف.",
  },
  {
    icon: Banknote,
    title: "لا ترسل أي مبلغ مقدماً",
    text: "الدفع يكون عند الاستلام. احذر طلبات التحويل قبل المعاينة.",
  },
];

export default function SafetyCard() {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-gold-200 bg-gradient-to-br from-gold-50 via-surface to-gold-50/60 p-5 shadow-md sm:p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 h-40 w-40 animate-blob-drift rounded-full bg-gold-200/50 blur-3xl end-[-2rem]"
      />

      <header className="relative flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-brand-900 shadow-sm">
          <ShieldCheck size={21} strokeWidth={2.2} />
        </span>

        <div>
          <h2 className="text-[15px] font-extrabold text-ink">
            نصائح للتعامل الآمن
          </h2>

          <p className="mt-0.5 text-[12.5px] text-gold-700">
            خطوات بسيطة تحميك من الاحتيال
          </p>
        </div>
      </header>

      <ul className="relative mt-5 space-y-3">
        {TIPS.map((tip) => (
          <li
            key={tip.title}
            className="flex items-start gap-3 rounded-2xl border border-line bg-surface/70 p-3.5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700">
              <tip.icon size={16} strokeWidth={2.1} />
            </span>

            <div className="min-w-0">
              <p className="text-[13.5px] font-bold leading-6 text-ink">
                {tip.title}
              </p>

              <p className="mt-0.5 text-[12.5px] leading-6 text-ink-soft">
                {tip.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
