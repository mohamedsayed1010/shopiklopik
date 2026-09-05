import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, ImageOff } from "lucide-react";

import { BANNER_FRAME, bannerAspectStyle } from "./bannerFrame";
import { resolveBannerTarget } from "../../utils/bannerPlacements";
import { resolveMediaUrl } from "../../utils/mediaUrl";


export default function BannerCard({
  banner,
  placement,
  priority = false,
  className = "",
}) {
  const navigate = useNavigate();

  const [failed, setFailed] = useState(false);

  const resolveArtwork = banner?.isFallback
    ? (url) => url || null
    : resolveMediaUrl;

  const desktop = resolveArtwork(banner?.desktopImageUrl);

  const mobile = resolveArtwork(banner?.mobileImageUrl);

  const primary = desktop || mobile;

  const target = resolveBannerTarget(banner);

  /* The server sends no alt text of its own, so the banner's own title is the
     closest honest description; a paid placement with neither is decorative. */
  const alt = banner?.title || banner?.slotName || "";

  const style = bannerAspectStyle(placement);

  if (!primary || failed) {
    return (
      <div
        style={style}
        className={`flex ${BANNER_FRAME} w-full items-center justify-center rounded-2xl border border-line bg-canvas text-brand-300 ${className}`}
      >
        <ImageOff size={22} strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  const artwork = (
    <picture>
      {mobile && desktop && (
        <source media="(max-width: 639px)" srcSet={mobile} />
      )}

      <img
        src={primary}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover/banner:scale-[1.02]"
      />
    </picture>
  );

  const title = String(banner?.title ?? "").trim();

  const description = String(banner?.description ?? "").trim();

  const hasOverlay = Boolean(title || description || banner?.buttonText);

  const overlay = hasOverlay ? (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-brand-950/85 via-brand-950/40 to-transparent"
      />

      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-3 text-start sm:gap-1.5 sm:p-5">
        {title && (
          <span className="block max-w-[46ch] text-[13.5px] font-bold leading-6 text-white drop-shadow-sm sm:text-base">
            {title}
          </span>
        )}

        {description && (
          <span className="line-clamp-2 block max-w-[60ch] text-[11.5px] leading-5 text-brand-100/90 sm:text-[13px] sm:leading-6">
            {description}
          </span>
        )}

        {banner?.buttonText && (
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-gold-300 px-3.5 py-2 text-[12.5px] font-bold text-brand-900 shadow-lg transition-transform duration-300 ease-out group-hover/banner:-translate-y-0.5 sm:px-4 sm:text-[13.5px]">
            {banner.buttonText}

            {target?.kind === "external" ? (
              <ExternalLink size={14} aria-hidden="true" />
            ) : (
              <ArrowLeft size={15} aria-hidden="true" />
            )}
          </span>
        )}
      </span>
    </>
  ) : null;

  const frame = (
    <span
      style={style}
      className={`relative block ${BANNER_FRAME} w-full overflow-hidden`}
    >
      {artwork}
      {overlay}
    </span>
  );

  const shell =
    "group/banner block w-full overflow-hidden rounded-2xl border border-line bg-canvas shadow-xs";

  if (!target) {
    return <div className={`${shell} ${className}`}>{frame}</div>;
  }

  const interactive =
    "cursor-pointer transition-[border-color,box-shadow] duration-300 ease-out hover:border-gold-500/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

  if (target.kind === "external") {
    return (
      <a
        href={target.href}
        target="_blank"
        rel="noreferrer"
        aria-label={alt || undefined}
        className={`${shell} ${interactive} ${className}`}
      >
        {frame}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate(target.to)}
      aria-label={alt || undefined}
      className={`${shell} ${interactive} text-start ${className}`}
    >
      {frame}
    </button>
  );
}
