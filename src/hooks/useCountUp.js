import { useEffect, useRef, useState } from "react";

export default function useCountUp(target, duration = 900) {
  const value = Number.isFinite(Number(target)) ? Number(target) : 0;

  const [display, setDisplay] = useState(0);

  const fromRef = useRef(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced || value === fromRef.current) {
      fromRef.current = value;
      setDisplay(value);

      return undefined;
    }

    const from = fromRef.current;

    const start = performance.now();

    let frame = 0;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);

      // Ease-out cubic: quick to read, calm to finish.
      const eased = 1 - (1 - progress) ** 3;

      const next = Math.round(from + (value - from) * eased);

      fromRef.current = next;
      setDisplay(next);

      if (progress < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = value;
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}
