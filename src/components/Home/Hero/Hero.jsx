import { useNavigate } from "react-router-dom";
import { Plus, ShieldCheck, MapPin, MessagesSquare } from "lucide-react";

import SearchBox from "../../Search/SearchBox";
import Button from "../../ui/Button";
import bg from "../../../assets/bg.jpg";
import bg1 from "../../../assets/bg1.png";

const TRUST_MARKERS = [
  { icon: MapPin, label: "كل احتياجاتك في مكان واحد" },
  { icon: MessagesSquare, label: "تواصل مباشر مع البائع" },
  { icon: ShieldCheck, label: "بدون عمولة" },
];

export default function Hero() {
  const navigate = useNavigate();

  const scrollToCategories = () => {
    document
      .getElementById("categories")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative z-20 isolate border-b border-white/5 bg-brand-900">
      <picture className="contents">
        <source media="(max-width: 1023px)" srcSet={bg1} />

        <img
          src={bg}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[30%_78%] sm:object-[center_85%]"
        />
      </picture>

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-brand-950/22"
      />

      {/* One notch shorter again. Only the section's own vertical padding
          moves — every internal margin, and so every proportion between the
          heading, the search box, the actions and the markers, is untouched. */}
      <div className="mx-auto max-w-3xl px-4 py-7 text-center sm:px-6 sm:py-10 lg:py-12">
        <h1 className="text-[25px] font-bold leading-snug tracking-tight text-white sm:text-4xl">
          كل ما تبحث عنه في الفيوم
          <span className="block text-gold-300">في مكان واحد</span>
        </h1>

        <p className="mx-auto mt-3.5 max-w-xl text-[13px] leading-6 text-brand-200 sm:mt-4 sm:text-base sm:leading-7">
              نحن همزة الوصل بين كل منتج والمستهلك  
        </p>

        {/* Search */}
        <SearchBox className="mx-auto mt-7 w-[85%]  max-w-xl sm:mt-8" />

        {/* Actions — full width on phones so the primary action is unmissable */}
        {/* <div className="mt-6 flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          <Button variant="gold" onClick={() => navigate("/create-product")}>
            <Plus size={18} strokeWidth={2.5} />
            انشر إعلانك مجاناً
          </Button>

          <Button
            variant="outline"
            onClick={scrollToCategories}
            className="border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            تصفّح الأقسام
          </Button>
        </div> */}

        {/* Trust markers */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 text-[11px] text-brand-200 sm:mt-8 sm:gap-x-6 sm:gap-y-3 sm:text-sm">
          {TRUST_MARKERS.map((marker) => (
            <li key={marker.label} className="flex items-center gap-1.5 sm:gap-2">
              <marker.icon
                size={14}
                className="shrink-0 text-gold-300 sm:size-[15px]"
              />
              {marker.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
