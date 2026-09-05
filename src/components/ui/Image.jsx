import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function Image({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  ratio = "aspect-[4/3]",
  priority = false,
  children,
}) {
  const [status, setStatus] = useState(src ? "loading" : "error");

  return (
    <div
      className={`relative overflow-hidden bg-brand-50 ${ratio} ${className}`}
    >
      {status !== "error" && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setStatus("loaded")}
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
