import { useMemo, useState } from "react";
import { Download, ExternalLink, ImageOff, RotateCw, ZoomIn } from "lucide-react";

import Modal from "../ui/Modal";
import Skeleton from "../ui/Skeleton";
import { usePaymentScreenshot } from "../../hooks/usePayments";
import { protectedApiPath, resolveMediaUrl } from "../../utils/mediaUrl";

/* A receipt served by the API itself (`/api/payments/{id}/screenshot`) needs
   the Bearer token: it answers 401 to a plain <img>. Such a URL is loaded
   through the authenticated client; anything else (an upload path, a local
   preview) is a public image and is shown as before. */

/* A callback ref that writes an object URL for `blob` onto the element's
   `attribute` and revokes it when the element detaches or the Blob changes.
   Every attach makes its own URL, so StrictMode's attach → detach → attach
   never leaves a revoked URL on screen. No React state holds the URL. */
function objectUrlRef(blob, attribute) {
  return (element) => {
    if (!element || !blob || typeof URL === "undefined" || !URL.createObjectURL) return undefined;

    const url = URL.createObjectURL(blob);

    element.setAttribute(attribute, url);

    return () => {
      element.removeAttribute(attribute);

      URL.revokeObjectURL(url);
    };
  };
}

const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

function Placeholder({ box, title, className = "", children }) {
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl border border-dashed border-line-strong bg-canvas text-brand-300 ${className}`}
      title={title}
      role="img"
      aria-label={title}
    >
      {children ?? <ImageOff size={18} strokeWidth={1.6} aria-hidden="true" />}
    </span>
  );
}

export default function ScreenshotViewer({
  url,
  alt = "صورة إيصال التحويل",
  size = "md",
  interactive = true,
  className = "",
}) {
  const [open, setOpen] = useState(false);

  /* Remembered per source, so a new source (a retry, another receipt) gets
     its own chance to load. */
  const [failedKey, setFailedKey] = useState(null);

  const resolved = resolveMediaUrl(url);

  const apiPath = protectedApiPath(resolved);

  const screenshot = usePaymentScreenshot(apiPath);

  const blob = apiPath ? screenshot.data ?? null : null;

  const srcRef = useMemo(() => objectUrlRef(blob, "src"), [blob]);

  const hrefRef = useMemo(() => objectUrlRef(blob, "href"), [blob]);

  /* What is being shown: the public URL, or the loaded receipt. */
  const sourceKey = apiPath ? (blob ? `${apiPath}@${screenshot.dataUpdatedAt}` : null) : resolved;

  /* Public images keep their plain src; protected ones get it from the ref. */
  const srcProps = apiPath ? { ref: srcRef } : { src: resolved };

  const hrefProps = apiPath ? { ref: hrefRef } : { href: resolved };

  const box =
    size === "sm" ? "h-12 w-12" : size === "lg" ? "h-32 w-32" : "h-20 w-20";

  if (!resolved) return <Placeholder box={box} title="لا توجد صورة" className={className} />;

  if (apiPath && screenshot.isLoading) {
    return (
      <span className={`block ${box} shrink-0 ${className}`} aria-busy="true" aria-label="جارٍ تحميل صورة الإيصال">
        <Skeleton className="h-full w-full rounded-xl" />
      </span>
    );
  }

  const loadError = apiPath && screenshot.isError;

  if (loadError || (sourceKey && failedKey === sourceKey)) {
    const status = screenshot.error?.response?.status;

    const message =
      status === 404
        ? "الإيصال غير متاح."
        : status === 401 || status === 403
          ? "لا يمكن عرض هذا الإيصال لحسابك."
          : "تعذّر تحميل صورة الإيصال.";

    if (!interactive) return <Placeholder box={box} title={message} className={className} />;

    const canRetry = Boolean(apiPath) && status !== 404 && status !== 401 && status !== 403;

    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <Placeholder box={box} title={message} />

        <div className="min-w-0 space-y-2" role="alert">
          <p className="text-[13px] text-ink-soft">{message}</p>

          {canRetry && (
            <button
              type="button"
              onClick={() => {
                setFailedKey(null);
                screenshot.refetch();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-brand-800 hover:text-brand-950"
            >
              <RotateCw size={14} aria-hidden="true" />
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!sourceKey) return <Placeholder box={box} title="لا توجد صورة" className={className} />;

  const image = (
    <img
      {...srcProps}
      alt={alt}
      loading={apiPath ? undefined : "lazy"}
      decoding="async"
      onError={() => setFailedKey(sourceKey)}
      className="h-full w-full object-cover"
    />
  );

  if (!interactive) {
    return (
      <span className={`block ${box} shrink-0 overflow-hidden rounded-xl border border-line bg-canvas ${className}`}>
        {image}
      </span>
    );
  }

  const fileName = `receipt.${EXTENSIONS[screenshot.data?.type] ?? "jpg"}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="عرض صورة الإيصال"
        className={`group relative ${box} shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line bg-canvas transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-300 ${className}`}
      >
        {image}

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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              {...hrefProps}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition-colors duration-200 hover:text-brand-950"
            >
              <ExternalLink size={15} aria-hidden="true" />
              فتح الصورة في تبويب جديد
            </a>

            {apiPath && (
              <a
                ref={hrefRef}
                download={fileName}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition-colors duration-200 hover:text-brand-950"
              >
                <Download size={15} aria-hidden="true" />
                تنزيل الصورة
              </a>
            )}
          </div>
        }
      >
        <img
          {...srcProps}
          alt={alt}
          className="mx-auto max-h-[65vh] w-auto rounded-xl object-contain"
        />
      </Modal>
    </>
  );
}
