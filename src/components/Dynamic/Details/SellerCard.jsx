import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  CalendarCheck,
  Check,
  Copy,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import Panel from "./Panel";
import Button from "../../ui/Button";
import { avatarHue, initialsFrom } from "../../../utils/adModel";
import { formatDate, formatRelativeTime } from "../../../utils/format";

/** An elegant initials avatar, never a broken image placeholder. */
function Avatar({ seller }) {
  const [failed, setFailed] = useState(false);

  const showPhoto = seller.avatar && !failed;

  const hue = avatarHue(seller.name ?? seller.id ?? "شبيك لبيك");

  return (
    <span className="relative shrink-0">
      <span
        aria-hidden="true"
        className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-gold-300/50 to-brand-400/40 opacity-0 blur-md transition-opacity duration-500 group-hover/seller:opacity-100"
      />

      {showPhoto ? (
        <img
          src={seller.avatar}
          alt={seller.name ?? ""}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="relative h-16 w-16 rounded-full border-2 border-white object-cover shadow-md"
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            backgroundImage: `linear-gradient(140deg, hsl(${hue} 46% 34%), hsl(${
              (hue + 38) % 360
            } 52% 22%))`,
          }}
          className="relative flex h-16 w-16 select-none items-center justify-center rounded-full border-2 border-white text-lg font-extrabold tracking-tight text-white shadow-md"
        >
          {initialsFrom(seller.name)}
        </span>
      )}
    </span>
  );
}

function DetailLine({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2 text-[12.5px] text-muted">
      <Icon size={13} className="shrink-0 text-brand-400" />
      <span className="truncate">{children}</span>
    </li>
  );
}

export default function SellerCard({ seller, postedAt }) {
  const [isCopied, setCopied] = useState(false);

  if (!seller?.name && !seller?.phone) return null;

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(seller.phone);

      setCopied(true);
      toast.success("تم نسخ رقم الهاتف");

      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذّر نسخ الرقم");
    }
  };

  return (
    <Panel className="group/seller transition-shadow duration-500 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <Avatar seller={seller} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-extrabold leading-7 text-ink">
            {seller.name ?? "معلن على شوبيك لوبيك"}
          </p>

          <ul className="mt-1.5 space-y-1">
            {seller.memberSince && (
              <DetailLine icon={CalendarCheck}>
                عضو منذ {formatDate(seller.memberSince)}
              </DetailLine>
            )}

            {postedAt && (
              <DetailLine icon={ShieldCheck}>
                نشر هذا الإعلان {formatRelativeTime(postedAt)}
              </DetailLine>
            )}

            {seller.location && (
              <DetailLine icon={MapPin}>{seller.location}</DetailLine>
            )}
          </ul>
        </div>
      </div>

      {seller.phone ? (
        <div className="mt-5 space-y-2.5">
          <div className="flex items-stretch gap-2">
            <p
              dir="ltr"
              className="tnum flex flex-1 items-center justify-center rounded-xl border border-line-strong bg-gradient-to-b from-white to-canvas py-3 text-lg font-extrabold tracking-wider text-ink shadow-xs"
            >
              {seller.phone}
            </p>

            <button
              type="button"
              onClick={copyPhone}
              aria-label="نسخ رقم الهاتف"
              title="نسخ رقم الهاتف"
              className={`flex w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-[background-color,border-color,color,transform] duration-300 ease-out active:scale-95 ${
                isCopied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                  : "border-line-strong bg-surface text-muted hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
              }`}
            >
              {isCopied ? <Check size={18} /> : <Copy size={17} />}
            </button>
          </div>

          <Button as="a" href={seller.phoneHref} size="lg" fullWidth>
            <Phone size={18} />
            اتصل بالمعلن
          </Button>

          {seller.whatsappHref && (
            <Button
              as="a"
              href={seller.whatsappHref}
              target="_blank"
              rel="noreferrer"
              variant="whatsapp"
              size="lg"
              fullWidth
            >
              <MessageCircle size={18} />
              مراسلة على واتساب
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-line bg-canvas px-4 py-3 text-[13px] leading-6 text-muted">
          لم يضف المعلن وسيلة تواصل لهذا الإعلان.
        </p>
      )}

      {(seller.email || seller.website) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line/70 pt-4">
          {seller.email && (
            <a
              href={`mailto:${seller.email}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-[12.5px] font-semibold text-ink-soft transition-[border-color,background-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50"
            >
              <Mail size={13} className="shrink-0 text-brand-400" />
              <span className="truncate">{seller.email}</span>
            </a>
          )}

          {seller.website && (
            <a
              href={seller.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-[12.5px] font-semibold text-ink-soft transition-[border-color,background-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50"
            >
              <Globe size={13} className="shrink-0 text-brand-400" />
              <span className="truncate">الموقع الإلكتروني</span>
            </a>
          )}
        </div>
      )}
    </Panel>
  );
}
