import { useState } from "react";
import { Check, Copy, Gift, Link2, Share2 } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Skeleton from "../../../components/ui/Skeleton";

/** Clipboard, with the older `execCommand` path for insecure origins. */
async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);

      return true;
    }
  } catch {
    /* Falls through to the textarea below. */
  }

  try {
    const field = document.createElement("textarea");

    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";

    document.body.appendChild(field);
    field.select();

    const ok = document.execCommand("copy");

    document.body.removeChild(field);

    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ value, label, copiedLabel, variant = "outline" }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  return (
    <Button
      variant={variant}
      onClick={async () => {
        const ok = await copyText(value);

        if (!ok) {
          toast.error("تعذّر النسخ. انسخ النص يدويًا.");

          return;
        }

        setCopied(true);
        toast.success(copiedLabel);

        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check size={17} /> : <Copy size={17} />}
      {copied ? "تم النسخ" : label}
    </Button>
  );
}

function CardShell({ icon: Icon, title, children, className = "" }) {
  return (
    <div
      className={`min-w-0 rounded-3xl border border-line bg-surface p-5 shadow-xs sm:p-6 ${className}`}
    >
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-ink">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon size={18} strokeWidth={2} aria-hidden="true" />
        </span>
        {title}
      </h2>

      <div className="mt-4">{children}</div>
    </div>
  );
}

export function ReferralCardsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="rounded-3xl border border-line bg-surface p-5 shadow-xs sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-3.5 w-32" />
          </div>

          <Skeleton className="mt-5 h-12 w-full rounded-xl" />

          <div className="mt-4 flex gap-3">
            <Skeleton className="h-11 w-32 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReferralShareCards({ referral }) {
  const code = referral?.referralCode ?? "";

  const link = referral?.referralLink ?? "";

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  async function share() {
    if (!link) return;

    try {
      await navigator.share({
        title: "شوبيك لوبيك",
        text: "انضم إلى شوبيك لوبيك عبر دعوتي",
        /* The server's link, untouched. */
        url: link,
      });
    } catch (error) {
      /* A dismissed share sheet is not a failure. */
      if (error?.name !== "AbortError") {
        toast.error("تعذّرت المشاركة. جرّب نسخ الرابط.");
      }
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      <CardShell icon={Gift} title="كود الدعوة الخاص بك">
        <p
          dir="ltr"
          className="w-full truncate rounded-xl border border-dashed border-gold-300 bg-gold-50/60 px-4 py-3 text-center text-xl font-extrabold tracking-[0.2em] text-brand-900"
        >
          {code || "—"}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <CopyButton value={code} label="نسخ الكود" copiedLabel="تم نسخ الكود" />
        </div>
      </CardShell>

      <CardShell icon={Link2} title="رابط الدعوة">
        <p
          dir="ltr"
          className="w-full truncate rounded-xl border border-line-strong bg-canvas px-4 py-3 text-sm text-ink-soft"
          title={link}
        >
          {link || "—"}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <CopyButton
            value={link}
            label="نسخ الرابط"
            copiedLabel="تم نسخ الرابط"
            variant="primary"
          />

          {canShare && link && (
            <Button variant="gold" onClick={share}>
              <Share2 size={17} />
              مشاركة
            </Button>
          )}
        </div>
      </CardShell>
    </div>
  );
}
