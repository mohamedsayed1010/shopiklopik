import { useLayoutEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

/* Sources that have already finished loading in this session. A card that
   remounts — returning to a page, say — would otherwise shimmer and fade in
   again for an image the browser is holding in memory. */
const loadedSources = new Set();

export default function Image({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  ratio = "aspect-[4/3]",
  priority = false,
  children,
}) {
  const [status, setStatus] = useState(() => {
    if (!src) return "error";

    return loadedSources.has(src) ? "loaded" : "loading";
  });

  const imgRef = useRef(null);

  const markLoaded = () => {
    loadedSources.add(src);
    setStatus("loaded");
  };

  /* Already decoded from the cache before the first paint: skip the
     placeholder rather than flashing it for a frame. */
  useLayoutEffect(() => {
    const img = imgRef.current;

    if (status === "loading" && img?.complete && img.naturalWidth > 0) {
      markLoaded();
    }
    // Checked once, on mount; `onLoad` covers everything after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`relative overflow-hidden bg-brand-50 ${ratio} ${className}`}
    >
      {status !== "error" && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={markLoaded}
          onError={() => setStatus("error")}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          } ${imgClassName}`}
        />
      )}

      {status === "loading" && (
        <div className="shimmer absolute inset-0" aria-hidden="true" />
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-brand-300">
          <ImageOff size={26} strokeWidth={1.5} />
          <span className="text-xs font-medium">لا توجد صورة</span>
        </div>
      )}

      {children}
    </div>
  );
}
