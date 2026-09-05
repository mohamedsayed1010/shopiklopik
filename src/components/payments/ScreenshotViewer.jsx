import { useState } from "react";
import { ExternalLink, ImageOff, ZoomIn } from "lucide-react";

import Modal from "../ui/Modal";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function ScreenshotViewer({
  url,
  alt = "صورة إيصال التحويل",
  size = "md",
  interactive = true,
  className = "",
}) {
  const [open, setOpen] = useState(false);

  const [failed, setFailed] = useState(false);

  const resolved = resolveMediaUrl(url);

  const box =
    size === "sm" ? "h-12 w-12" : size === "lg" ? "h-32 w-32" : "h-20 w-20";

  if (!resolved) {
    return (
      <span
        className={`flex ${box} items-center justify-center rounded-xl border border-dashed border-line-strong bg-canvas text-brand-300 ${className}`}
        title="لا توجد صورة"
      >
        <ImageOff size={18} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }

  if (failed) {
    return (
      <span
        className={`flex ${box} items-center justify-center rounded-xl border border-line bg-canvas text-brand-300 ${className}`}
        title="تعذّر تحميل الصورة"
      >
        <ImageOff size={18} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }

  if (!interactive) {
    return (
      <span
        className={`block ${box} shrink-0 overflow-hidden rounded-xl border border-line bg-canvas ${className}`}
      >
        <img
          src={resolved}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="عرض صورة الإيصال"
        className={`group relative ${box} shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line bg-canvas transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-300 ${className}`}
      >
        <img
          src={resolved}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />

        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-brand-950/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <ZoomIn size={18} className="text-white" />
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="صورة إيصال التحويل"
        size="lg"
        footer={
          <a
            href={resolved}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition-colors duration-200 hover:text-brand-950"
          >
            <ExternalLink size={15} aria-hidden="true" />
            فتح الصورة في تبويب جديد
          </a>
        }
      >
        <img
          src={resolved}
          alt={alt}
          className="mx-auto max-h-[65vh] w-auto rounded-xl object-contain"
        />
      </Modal>
    </>
  );
}
