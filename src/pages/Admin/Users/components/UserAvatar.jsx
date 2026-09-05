import { useState } from "react";

import { initialsOf } from "../usersConstants";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";

export default function UserAvatar({ user, size = 36 }) {
  const [failed, setFailed] = useState(false);

  const src = user?.image ? resolveMediaUrl(user.image) : null;

  const dimension = { width: size, height: size };

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        style={dimension}
        className="flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600"
      >
        <span style={{ fontSize: Math.round(size * 0.36) }}>
          {initialsOf(user?.name, user?.userName)}
        </span>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={dimension}
      className="shrink-0 rounded-full object-cover"
    />
  );
}
