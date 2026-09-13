import { useEffect, useRef, useState } from "react";

export default function useNearViewport(margin = 600) {
  const ref = useRef(null);

  const [isNear, setNear] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    if (isNear) return undefined;

    const element = ref.current;

    if (!element) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: `${margin}px 0px` }
    );

    observer.observe(element);

    let frame = 0;

    const check = () => {
      frame = 0;

      if (element.getBoundingClientRect().top < window.innerHeight + margin) {
        setNear(true);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isNear, margin]);

  return [ref, isNear];
}
