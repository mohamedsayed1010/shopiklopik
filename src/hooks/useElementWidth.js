import { useEffect, useRef, useState } from "react";

export default function useElementWidth() {
  const ref = useRef(null);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) return undefined;

    // Seed synchronously so the first paint is not a zero-width chart.
    setWidth(element.getBoundingClientRect().width);

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width;

      if (typeof next === "number") setWidth(next);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
