import { useState } from "react";

import { resolveMediaUrl } from "../../../utils/mediaUrl";
import { avatarHue, initialsFrom } from "../../../utils/adModel";

export default function ProfileAvatar({
  src,
  name,
  size = 128,
  className = "",
  bust = 0,
}) {
  const resolved = resolveMediaUrl(src);

  const href =
    resolved && bust
      ? `${resolved}${resolved.includes("?") ? "&" : "?"}v=${bust}`
      : resolved;

  /* Remember *which* URL failed rather than a bare flag: a new photo then
     retries on its own, with no effect needed to clear the old failure. */
  const [failedHref, setFailedHref] = useState(null);

  const showPhoto = Boolean(href) && failedHref !== href;

  const hue = avatarHue(name || "شبيك لبيك");

  const initials = initialsFrom(name);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        // A two-stop wash reads as a designed mark; a flat fill reads as a gap.
        background: showPhoto
          ? undefined
          : `linear-gradient(140deg, hsl(${hue} 62% 58%), hsl(${(hue + 42) % 360} 66% 42%))`,
      }}
    >
      {showPhoto ? (
        <img
          src={href}
          alt={name ? `صورة ${name}` : "الصورة الشخصية"}
          decoding="async"
          onError={() => setFailedHref(href)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="select-none font-bold uppercase leading-none text-white"
          style={{
            fontSize: Math.round(size * 0.36),
            textShadow: "0 1px 2px rgba(0,0,0,.18)",
          }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
