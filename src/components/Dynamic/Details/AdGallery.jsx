import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  ImageIcon,
  Play,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import Image from "../../ui/Image";

function useSlides(images, videos) {
  const slides = [
    ...images.map((url) => ({ type: "image", url })),
    ...videos.map((url) => ({ type: "video", url })),
  ];

  return slides;
}

/** Nothing to show — a composed placeholder, not a broken frame. */
function EmptyStage({ label }) {
  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-brand-50 via-surface to-brand-100 shadow-lg">
      <span
        aria-hidden="true"
        className="absolute -top-16 h-56 w-56 animate-blob-drift rounded-full bg-gold-200/40 blur-3xl end-[-3rem]"
      />

      <span
        aria-hidden="true"
        className="absolute -bottom-20 h-64 w-64 animate-blob-drift rounded-full bg-brand-200/40 blur-3xl start-[-3rem]"
      />

      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/70 bg-white/70 text-brand-400 shadow-md backdrop-blur-sm">
          <ImageIcon size={32} strokeWidth={1.4} />
        </span>

        <p className="text-[15px] font-semibold text-ink-soft">
          لم يضف المعلن صوراً لهذا الإعلان
        </p>

        <p className="max-w-xs text-[13px] leading-6 text-muted">
          تواصل مع المعلن لطلب صور إضافية قبل اتخاذ قرارك.
        </p>

        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

export default function AdGallery({ images = [], videos = [], title = "" }) {
  const slides = useSlides(images, videos);

  const [active, setActive] = useState(0);
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [isZoomed, setZoomed] = useState(false);

  const stageRef = useRef(null);

  const count = slides.length;

  const go = useCallback(
    (next) => {
      if (count === 0) return;

      setZoomed(false);
      setActive(((next % count) + count) % count);
    },
    [count]
  );

  /* Arrow keys drive the viewer; Escape closes it (or un-zooms first). */
  useEffect(() => {
    if (!isViewerOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") go(active - 1);
      else if (event.key === "ArrowLeft") go(active + 1);
      else if (event.key === "Escape") {
        if (isZoomed) setZoomed(false);
        else setViewerOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isViewerOpen, isZoomed, active, go]);

  /* Keep the active thumbnail in view as the hero advances. */
  useEffect(() => {
    const rail = stageRef.current;

    if (!rail) return;

    const thumb = rail.querySelector(`[data-index="${active}"]`);

    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  if (count === 0) return <EmptyStage label={title} />;

  const current = slides[active];

  const arrowClass =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/60 glass text-ink shadow-lg transition-[transform,opacity,background-color] duration-300 ease-out hover:scale-110 active:scale-95 sm:h-12 sm:w-12 sm:opacity-0 sm:group-hover:opacity-100";

  return (
    <div>
      <div className="group relative">
        {/* Ambient bloom picked up from the photo edges. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[36px] bg-gradient-to-br from-brand-200/40 via-transparent to-gold-200/40 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        />

        {current.type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full rounded-[28px] border border-line bg-brand-950 object-contain shadow-lg"
          />
        ) : (
          <Image
            src={current.url}
            alt={title}
            ratio="aspect-video"
            className="rounded-[28px] border border-line shadow-lg"
            imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.02]"
            priority={active === 0}
          >
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              aria-label="عرض الصورة بالحجم الكامل"
              className="absolute inset-0 h-full w-full cursor-zoom-in"
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-4 flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 start-4"
            >
              <Expand size={17} strokeWidth={2.2} />
            </span>
          </Image>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="السابق"
              onClick={() => go(active - 1)}
              className={`${arrowClass} start-4`}
            >
              <ChevronRight size={22} strokeWidth={2.4} />
            </button>

            <button
              type="button"
              aria-label="التالي"
              onClick={() => go(active + 1)}
              className={`${arrowClass} end-4`}
            >
              <ChevronLeft size={22} strokeWidth={2.4} />
            </button>

            <span className="tnum pointer-events-none absolute bottom-4 z-10 rounded-full glass-dark px-3.5 py-1.5 text-xs font-bold text-white shadow-lg end-4">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          ref={stageRef}
          className="no-scrollbar mt-3.5 flex gap-2.5 overflow-x-auto pb-1"
        >
          {slides.map((slide, index) => (
            <button
              key={`${slide.url}-${index}`}
              type="button"
              data-index={index}
              onClick={() => go(index)}
              aria-label={`عرض العنصر ${index + 1}`}
              aria-current={index === active}
              className={`relative shrink-0 cursor-pointer overflow-hidden rounded-2xl transition-[transform,box-shadow,opacity] duration-300 ease-out hover:-translate-y-0.5 ${
                index === active
                  ? "opacity-100 shadow-md ring-2 ring-brand-900 ring-offset-2 ring-offset-canvas"
                  : "opacity-55 hover:opacity-100"
              }`}
            >
              {slide.type === "video" ? (
                <span className="flex h-[76px] w-[76px] items-center justify-center bg-brand-900 text-gold-300 sm:h-20 sm:w-20">
                  <Play size={22} strokeWidth={2.2} className="fill-current" />
                </span>
              ) : (
                <Image
                  src={slide.url}
                  alt=""
                  ratio="aspect-square"
                  className="w-[76px] rounded-2xl sm:w-20"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {isViewerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="fixed inset-0 z-[120] flex flex-col bg-brand-950/96 backdrop-blur-md"
            >
              <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 text-white sm:px-6">
                <span className="tnum rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white/80">
                  {active + 1} / {count}
                </span>

                <div className="flex items-center gap-2">
                  {current.type === "image" && (
                    <button
                      type="button"
                      onClick={() => setZoomed((zoomed) => !zoomed)}
                      aria-label={isZoomed ? "تصغير" : "تكبير"}
                      aria-pressed={isZoomed}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-[background-color,transform] duration-300 hover:bg-white/20 active:scale-95"
                    >
                      {isZoomed ? <ZoomOut size={19} /> : <ZoomIn size={19} />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewerOpen(false)}
                    aria-label="إغلاق"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-[background-color,transform] duration-300 hover:bg-white/20 active:scale-95"
                  >
                    <X size={20} />
                  </button>
                </div>
              </header>

              <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 pb-4 sm:px-16">
                {current.type === "video" ? (
                  <video
                    key={current.url}
                    src={current.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full rounded-2xl"
                  />
                ) : (
                  <motion.img
                    key={current.url}
                    src={current.url}
                    alt={title}
                    /* Dragging is only useful once the image outgrows the
                       viewport, so panning is enabled with the zoom. */
                    drag={isZoomed}
                    dragElastic={0.08}
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: isZoomed ? 2.1 : 1, x: 0, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    onDoubleClick={() => setZoomed((zoomed) => !zoomed)}
                    className={`max-h-full max-w-full rounded-2xl object-contain shadow-2xl ${
                      isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                    }`}
                    onClick={() => !isZoomed && setZoomed(true)}
                  />
                )}

                {count > 1 && !isZoomed && (
                  <>
                    <button
                      type="button"
                      aria-label="السابق"
                      onClick={() => go(active - 1)}
                      className="absolute top-1/2 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-300 hover:bg-white/20 active:scale-95 start-2 sm:start-5"
                    >
                      <ChevronRight size={24} />
                    </button>

                    <button
                      type="button"
                      aria-label="التالي"
                      onClick={() => go(active + 1)}
                      className="absolute top-1/2 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-300 hover:bg-white/20 active:scale-95 end-2 sm:end-5"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  </>
                )}
              </div>

              {count > 1 && (
                <div className="no-scrollbar flex shrink-0 justify-start gap-2 overflow-x-auto px-4 pb-5 sm:justify-center sm:px-6">
                  {slides.map((slide, index) => (
                    <button
                      key={`viewer-${slide.url}-${index}`}
                      type="button"
                      onClick={() => go(index)}
                      aria-label={`عرض العنصر ${index + 1}`}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl transition-[opacity,transform] duration-300 ${
                        index === active
                          ? "opacity-100 ring-2 ring-gold-300"
                          : "opacity-45 hover:opacity-80"
                      }`}
                    >
                      {slide.type === "video" ? (
                        <span className="flex h-full w-full items-center justify-center bg-white/10 text-gold-300">
                          <Play size={16} className="fill-current" />
                        </span>
                      ) : (
                        <img
                          src={slide.url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
