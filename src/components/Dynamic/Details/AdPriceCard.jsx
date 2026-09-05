import { Handshake, MessageSquareText, Tag } from "lucide-react";

export default function AdPriceCard({ price }) {
  const hasPrice = Boolean(price?.text);

  return (
    <section
      className={`relative isolate overflow-hidden rounded-[26px] p-6 shadow-lg sm:p-7 ${
        hasPrice
          ? "bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950"
          : "border border-line/80 bg-gradient-to-br from-white to-brand-50"
      }`}
    >
      {hasPrice && (
        <>
          {/* Slow gold halo behind the amount. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 h-64 w-64 animate-glow-pulse rounded-full bg-gold-400/25 blur-3xl end-[-4rem]"
          />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 h-64 w-64 animate-glow-pulse rounded-full bg-brand-400/25 blur-3xl start-[-4rem]"
          />

          {/* One light pass across the plate every few seconds. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -inset-x-8 -z-0 w-24 animate-sheen bg-gradient-to-r from-transparent via-white/12 to-transparent"
          />
        </>
      )}

      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] ${
              hasPrice ? "text-gold-300/90" : "text-brand-500"
            }`}
          >
            <Tag size={14} strokeWidth={2.4} />
            {hasPrice ? price.label : "السعر"}
          </p>

          {hasPrice ? (
            <p className="tnum mt-3 text-[34px] font-extrabold leading-none text-white drop-shadow-sm sm:text-[44px]">
              {price.text}
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-2.5 text-[17px] font-bold leading-8 text-ink sm:text-xl">
              <MessageSquareText
                size={20}
                strokeWidth={2.2}
                className="shrink-0 text-brand-500"
              />
              تواصل مع المعلن لمعرفة السعر
            </p>
          )}
        </div>

        {hasPrice && price.negotiable && (
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-gold-300/15 px-4 py-2 text-[13px] font-bold text-gold-200 backdrop-blur-sm">
            <Handshake size={15} strokeWidth={2.2} />
            قابل للتفاوض
          </span>
        )}
      </div>
    </section>
  );
}
