import { MessageCircle, Phone } from "lucide-react";

export default function MobileContactBar({ seller }) {
  if (!seller?.phoneHref) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line/80 glass px-3 py-3 shadow-[0_-8px_24px_rgba(16,24,40,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2.5">
        <a
          href={seller.phoneHref}
          className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-900 text-[15px] font-bold text-white shadow-sm transition-[background-color,transform] duration-300 ease-out hover:bg-brand-800 active:scale-[.97]"
        >
          <Phone size={18} />
          اتصل بالمعلن
        </a>

        {seller.whatsappHref && (
          <a
            href={seller.whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label="مراسلة على واتساب"
            className="flex h-12 w-14 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#128C4A]/30 bg-surface text-[#128C4A] transition-[background-color,color,transform] duration-300 ease-out hover:bg-[#25D366] hover:text-white active:scale-95"
          >
            <MessageCircle size={20} />
          </a>
        )}
      </div>
    </div>
  );
}
