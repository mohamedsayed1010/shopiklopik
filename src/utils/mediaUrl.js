import { API_BASE_URL } from "../api/axiosInstance";

const API_ORIGIN = new URL(API_BASE_URL, window.location.href).origin;

const LOOPBACK = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i;

const INLINE = /^(data|blob):/i;

export function resolveMediaUrl(value) {
  if (typeof value !== "string") return null;

  const raw = value.trim();

  if (!raw) return null;

  // Object URLs from a local file preview are already displayable.
  if (INLINE.test(raw)) return raw;

  let url;

  try {
    url = new URL(raw, `${API_ORIGIN}/`);
  } catch {
    return null;
  }

  if (url.origin === API_ORIGIN) return url.href;

  /* A host we cannot reach, or an upload path stamped with the wrong origin.
     Anything else is a genuinely external link and is left untouched. */
  if (LOOPBACK.test(url.hostname) || url.pathname.startsWith("/uploads/")) {
    return `${API_ORIGIN}${url.pathname}${url.search}`;
  }

  return url.href;
}

export { API_ORIGIN };

export default resolveMediaUrl;
