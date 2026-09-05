import { ShieldCheck, MapPin, MessagesSquare } from "lucide-react";

import bg from "../../assets/bg.jpg";
import Logo from "./Logo";

const PROMISES = [
  { icon: MapPin, label: "إعلانات محلية داخل الفيوم" },
  { icon: MessagesSquare, label: "تواصل مباشر مع البائع" },
  { icon: ShieldCheck, label: "نشر مجاني وبدون عمولة" },
];

export default function AuthLayout({ title, subtitle, children, wide = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      {/* Brand panel — desktop */}
      <aside className="relative hidden w-[44%] max-w-[560px] shrink-0 overflow-hidden lg:block">
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Flat brand wash, not a decorative gradient: it exists to make the
            type legible over a photograph. */}
        <div aria-hidden="true" className="absolute inset-0 bg-brand-950/88" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-14">
          <Logo size="xl" tone="light" tagline />

          <div>
            {/* Brand copy in a decorative aside, not a section of the document:
                as an <h2> it preceded the page-s real <h1> in the DOM and read as
                a heading the page does not have. Styling is unchanged. */}
            <p className="text-[32px] font-bold leading-snug text-white xl:text-4xl">
              كل ما تبحث عنه
              <span className="block text-gold-300">في الفيوم</span>
            </p>

            <p className="mt-5 max-w-sm text-[15px] leading-8 text-brand-200">
              منصة تربط بين المشترين والبائعين داخل محافظة الفيوم، بطريقة سهلة
              وآمنة وبدون وسيط.
            </p>

            <ul className="mt-9 space-y-4 text-sm text-brand-100">
              {PROMISES.map((promise) => (
                <li key={promise.label} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <promise.icon size={16} className="text-gold-300" />
                  </span>
                  {promise.label}
                </li>
              ))}
            </ul>
          </div>

          {/* The year is read from the clock, as the footer already does — a
              literal one is correct for a few months and wrong afterwards. */}
          <p className="text-xs text-brand-400">
            © {new Date().getFullYear()} شوبيك لوبيك. جميع الحقوق محفوظة.
          </p>
        </div>
      </aside>

      {/* Brand header — mobile */}
      <header className="flex items-center justify-center border-b border-line bg-brand-900 px-5 py-5 lg:hidden">
        <Logo size="md" tone="light" tagline />
      </header>

      {/* Form */}
      <main className="flex flex-1 items-start justify-center px-5 py-8 sm:items-center sm:px-8 sm:py-12">
        <div className={`w-full ${wide ? "max-w-xl" : "max-w-sm"}`}>
          <div className="text-start">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink sm:text-3xl">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-2.5 text-sm leading-7 text-muted sm:text-[15px]">
                {subtitle}
              </p>
            )}
          </div>

          <div className="mt-7 sm:mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
