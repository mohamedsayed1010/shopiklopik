import { Clock, Eye, Flag, FlagOff, MapPin, Navigation } from "lucide-react";

import Panel from "./Panel";
import { formatNumber, formatRelativeTime } from "../../../utils/format";

const BADGE_TONES = {
  brand: "bg-brand-900 text-white shadow-sm",
  soft: "border border-brand-200 bg-brand-50 text-brand-800",
  gold: "border border-gold-300 bg-gradient-to-b from-gold-50 to-gold-100 text-gold-700",
};

function MetaChip({ icon: Icon, children, href }) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-surface/70 px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-[background-color,border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white";

  const content = (
    <>
      <Icon size={14} className="shrink-0 text-brand-400" />
      {children}
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}

export default function AdHeader({ model, hasReported = false, onReport }) {
  const { meta } = model;

  const hasMeta =
    model.location || meta.createdAt || meta.views > 0 || model.mapUrl;

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {model.badges.length > 0 && (
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              {model.badges.map((badge) => (
                <span
                  key={badge.key}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    BADGE_TONES[badge.tone] ?? BADGE_TONES.soft
                  }`}
                >
                  {badge.text}
                </span>
              ))}

              {meta.isExpired && (
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                  إعلان منتهي
                </span>
              )}
            </div>
          )}

          <h1 className="text-balance text-[22px] font-extrabold leading-9 tracking-tight text-ink sm:text-[30px] sm:leading-[1.28]">
            {model.title}
          </h1>
        </div>

        {hasReported ? (
          <span
            role="status"
            title="تم إرسال بلاغك عن هذا الإعلان"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-bold text-red-700"
          >
            <FlagOff size={15} strokeWidth={2.2} aria-hidden="true" />
            تم الإبلاغ
          </span>
        ) : (
          onReport && (
            <button
              type="button"
              onClick={onReport}
              aria-label="الإبلاغ عن هذا الإعلان"
              title="الإبلاغ عن هذا الإعلان"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line/80 bg-surface/70 text-muted transition-[color,background-color,border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
            >
              <Flag size={17} strokeWidth={2.1} />
            </button>
          )
        )}
      </div>

      {hasMeta && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {model.location && <MetaChip icon={MapPin}>{model.location}</MetaChip>}

          {model.mapUrl && (
            <MetaChip icon={Navigation} href={model.mapUrl}>
              الموقع على الخريطة
            </MetaChip>
          )}

          {meta.createdAt && (
            <MetaChip icon={Clock}>{formatRelativeTime(meta.createdAt)}</MetaChip>
          )}

          {meta.views > 0 && (
            <MetaChip icon={Eye}>
              <span className="tnum">{formatNumber(meta.views)}</span> مشاهدة
            </MetaChip>
          )}
        </div>
      )}

      {model.address && (
        <p className="mt-3 flex items-start gap-2 text-[13.5px] leading-6 text-ink-soft">
          <MapPin
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-brand-500"
          />
          <span className="min-w-0 break-words">{model.address}</span>
        </p>
      )}
    </Panel>
  );
}
