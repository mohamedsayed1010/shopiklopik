import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Check, Copy, Share2 } from "lucide-react";
import {
  FaFacebookF,
  FaFacebookMessenger,
  FaTelegram,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";

import Modal from "./Modal";

/** Facebook's web share dialog needs an app id; the sharer does not. */
const TARGETS = [
  {
    key: "whatsapp",
    label: "واتساب",
    Icon: FaWhatsapp,
    tint: "#25D366",
    href: ({ url, title }) =>
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    key: "facebook",
    label: "فيسبوك",
    Icon: FaFacebookF,
    tint: "#1877F2",
    href: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "messenger",
    label: "ماسنجر",
    Icon: FaFacebookMessenger,
    tint: "#0084FF",
    // The m.me composer works from the mobile web without an app id.
    href: ({ url }) =>
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
        url
      )}&redirect_uri=${encodeURIComponent(url)}&app_id=0`,
  },
  {
    key: "telegram",
    label: "تليجرام",
    Icon: FaTelegram,
    tint: "#26A5E4",
    href: ({ url, title }) =>
      `https://t.me/share/url?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`,
  },
  {
    key: "x",
    label: "إكس",
    Icon: FaXTwitter,
    tint: "#0f1419",
    href: ({ url, title }) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`,
  },
];

export function canShareNatively() {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

/** Clipboard API is https-only; the textarea trick covers the rest. */
async function writeToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const field = document.createElement("textarea");

    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";

    document.body.appendChild(field);
    field.select();

    const copied = document.execCommand("copy");

    document.body.removeChild(field);

    return copied;
  } catch {
    return false;
  }
}

function TargetButton({ target, url, title, onDone }) {
  const { Icon } = target;

  return (
    <a
      href={target.href({ url, title })}
      target="_blank"
      rel="noreferrer"
      onClick={onDone}
      style={{ "--tint": target.tint }}
      className="group flex flex-col items-center gap-2.5 rounded-2xl p-3 transition-[background-color,transform] duration-300 ease-out hover:bg-brand-50 focus-visible:bg-brand-50 active:scale-95"
    >
      <span
        aria-hidden="true"
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface text-[color:var(--tint)] shadow-xs transition-[transform,box-shadow,border-color,color] duration-300 ease-out group-hover:-translate-y-1 group-hover:border-transparent group-hover:bg-[color:var(--tint)] group-hover:text-white group-hover:shadow-lg"
      >
        <Icon className="h-[22px] w-[22px]" />
      </span>

      <span className="text-[12.5px] font-semibold text-ink-soft transition-colors duration-300 group-hover:text-ink">
        {target.label}
      </span>
    </a>
  );
}

export default function ShareModal({ open, onClose, url, title = "" }) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  const shareTitle = title || "شوبيك لوبيك";

  // A stale check-mark on reopen would claim a copy that never happened.
  const [wasOpen, setWasOpen] = useState(open);

  if (wasOpen !== open) {
    setWasOpen(open);

    if (!open) setCopied(false);
  }

  useEffect(() => {
    if (!copied) return undefined;

    const timer = setTimeout(() => setCopied(false), 2200);

    return () => clearTimeout(timer);
  }, [copied]);

  const copy = useCallback(async () => {
    const done = await writeToClipboard(shareUrl);

    if (done) {
      setCopied(true);
      toast.success("تم نسخ الرابط");
    } else {
      toast.error("تعذّر نسخ الرابط");
    }
  }, [shareUrl]);

  const openNativeSheet = useCallback(async () => {
    try {
      await navigator.share({ title: shareTitle, url: shareUrl });

      onClose?.();
    } catch (error) {
      // Dismissing the sheet is a normal outcome, not a failure.
      if (error?.name !== "AbortError") toast.error("تعذّرت المشاركة");
    }
  }, [shareTitle, shareUrl, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مشاركة الإعلان"
      description="اختر التطبيق الذي تريد المشاركة من خلاله"
      size="sm"
    >
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-5 sm:gap-2">
        {TARGETS.map((target) => (
          <TargetButton
            key={target.key}
            target={target}
            url={shareUrl}
            title={shareTitle}
            onDone={onClose}
          />
        ))}
      </div>

      {/* Link row */}
      <div className="mt-6">
        <p className="mb-2 text-[12.5px] font-semibold text-muted">
          أو انسخ الرابط
        </p>

        <div className="flex items-center gap-2 rounded-2xl border border-line bg-canvas p-1.5 ps-3.5 transition-colors duration-300 focus-within:border-brand-300">
          <span
            dir="ltr"
            className="min-w-0 flex-1 truncate text-[13px] text-ink-soft"
          >
            {shareUrl}
          </span>

          <button
            type="button"
            onClick={copy}
            aria-label="نسخ الرابط"
            className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 text-[13.5px] font-bold transition-[background-color,color,transform] duration-300 ease-out active:scale-95 ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-brand-900 text-white hover:bg-brand-800"
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "تم النسخ" : "نسخ"}
          </button>
        </div>
      </div>

      {/* The device's own sheet reaches apps the web intents above cannot. */}
      {canShareNatively() && (
        <button
          type="button"
          onClick={openNativeSheet}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line-strong bg-surface px-4 py-3 text-[14px] font-bold text-ink transition-[background-color,border-color,transform] duration-300 ease-out hover:border-brand-200 hover:bg-brand-50 active:scale-[.98]"
        >
          <Share2 size={17} />
          خيارات المشاركة الأخرى
        </button>
      )}
    </Modal>
  );
}
