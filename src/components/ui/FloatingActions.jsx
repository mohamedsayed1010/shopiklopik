import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Plus } from "lucide-react";
import useCreateAdTarget from "../../hooks/useCreateAdTarget";

/** Far enough that the button never appears during a small nudge. */
const SHOW_AFTER = 420;

export default function FloatingActions({ canCompose = true }) {
  /* Opens the form already on the section being browsed — see
     `useCreateAdTarget`. Falls back to the general flow everywhere else. */
  const createAdTarget = useCreateAdTarget();

  const [isScrolled, setScrolled] = useState(false);

  const [isFooterVisible, setFooterVisible] = useState(false);

  const frame = useRef(0);

  useEffect(() => {
    const read = () => {
      frame.current = 0;

      setScrolled(window.scrollY > SHOW_AFTER);
    };

    const onScroll = () => {
      if (frame.current) return;

      frame.current = requestAnimationFrame(read);
    };

    read();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);

      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  /* The footer mounts after the first paint on some routes, so the observer is
     re-attached whenever the route's content changes height. */
  useEffect(() => {
    const footer = document.querySelector("footer");

    if (!footer) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(footer);

    return () => {
      observer.disconnect();

      setFooterVisible(false);
    };
  }, [isScrolled]);

  const toTop = useCallback(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  }, []);

  const isVisible = !isFooterVisible;

  return (
    <div className="pointer-events-none fixed bottom-20 z-40 flex flex-col items-end gap-3 end-4 sm:bottom-8 sm:end-6 lg:bottom-8">
      <AnimatePresence>
        {isScrolled && isVisible && (
          <motion.button
            key="top"
            type="button"
            onClick={toTop}
            aria-label="العودة إلى أعلى الصفحة"
            initial={{ opacity: 0, scale: 0.7, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="glass group pointer-events-auto relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/70 text-brand-800 shadow-lg ring-1 ring-line/70 transition-[transform,color,box-shadow] duration-300 ease-out hover:scale-110 hover:text-brand-900 hover:shadow-xl active:scale-95"
          >
            {/* Halo, revealed on intent — the "glow" without a permanent bloom. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full opacity-0 shadow-[0_0_24px_-2px_rgba(54,88,136,.55)] transition-opacity duration-300 group-hover:opacity-100"
            />

            <ArrowUp
              size={19}
              strokeWidth={2.4}
              className="relative transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canCompose && isVisible && (
          <motion.div
            key="compose"
            initial={{ opacity: 0, scale: 0.8, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto hidden lg:block"
          >
            <Link
              to={createAdTarget}
              aria-label="أضف إعلانك"
              className="group relative flex h-14 items-center gap-0 overflow-hidden rounded-full bg-gold-300 px-4 text-brand-900 shadow-lg ring-1 ring-gold-500/30 transition-[background-color,box-shadow,transform,gap] duration-300 ease-out hover:gap-2.5 hover:bg-gold-400 hover:shadow-xl active:scale-95"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full opacity-0 shadow-[0_0_30px_-2px_rgba(239,180,32,.75)] transition-opacity duration-300 group-hover:opacity-100"
              />

              <Plus
                size={24}
                strokeWidth={2.6}
                className="relative shrink-0 transition-transform duration-500 ease-out group-hover:rotate-90"
              />

              {/* Label unrolls on intent, so the resting state stays a disc. */}
              <span className="relative max-w-0 overflow-hidden whitespace-nowrap text-[15px] font-bold opacity-0 transition-[max-width,opacity] duration-300 ease-out group-hover:max-w-[10rem] group-hover:opacity-100">
                أضف إعلانك
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
