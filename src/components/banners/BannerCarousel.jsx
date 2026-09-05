import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard, Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

import BannerCard from "./BannerCard";

import "swiper/css";
import "swiper/css/pagination";

/** Slow enough to read, quick enough not to feel stuck. */
const AUTOPLAY = {
  delay: 3000,
  disableOnInteraction: true,
  pauseOnMouseEnter: true,
};

function Arrow({ direction, onClick, label }) {
  const Icon = direction === "prev" ? ChevronRight : ChevronLeft;

  const edge = direction === "prev" ? "start-3" : "end-3";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      /* Hidden on phones, where the gesture is the control and an arrow would
         only sit on top of the artwork. Revealed on hover on desktop, and
         always reachable by keyboard through focus-visible. */
      className={`absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-brand-950/45 text-white opacity-0 shadow-lg backdrop-blur-md transition-[opacity,background-color,transform] duration-300 ease-out hover:bg-brand-950/70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 group-hover/carousel:opacity-100 sm:flex ${edge}`}
    >
      <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

export default function BannerCarousel({
  banners,
  placement,
  ctaSlide = null,
  priority = false,
}) {
  const swiperRef = useRef(null);

  return (
    <div className="group/carousel relative">
      <Swiper
        dir="rtl"
        modules={[Autoplay, Pagination, Navigation, Keyboard, A11y]}
        onSwiper={(instance) => {
          swiperRef.current = instance;
        }}
        loop
        speed={550}
        autoplay={AUTOPLAY}
        keyboard={{ enabled: true }}
        pagination={{ clickable: true }}
        a11y={{
          prevSlideMessage: "الإعلان السابق",
          nextSlideMessage: "الإعلان التالي",
        }}
        className="banner-swiper"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner.id}>
            <BannerCard
              banner={banner}
              placement={placement}
              /* Only the first slide is above the fold; the rest load lazily. */
              priority={priority && index === 0}
            />
          </SwiperSlide>
        ))}

        {ctaSlide && <SwiperSlide key="book-slot">{ctaSlide}</SwiperSlide>}
      </Swiper>

      <Arrow
        direction="prev"
        label="الإعلان السابق"
        onClick={() => swiperRef.current?.slidePrev()}
      />

      <Arrow
        direction="next"
        label="الإعلان التالي"
        onClick={() => swiperRef.current?.slideNext()}
      />
    </div>
  );
}
