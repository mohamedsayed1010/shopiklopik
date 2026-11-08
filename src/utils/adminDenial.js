import { decodeToken } from "./adminIdentity";

/**
 * Remembering "this session is not an administrator".
 *
 * This backend issues no role claim and its `UserDto`/`ProfileDto` carry no
 * role, so `GET /api/v2/admin/me/permissions` is the only thing that knows —
 * and for every regular account it answers 403. Asked fresh on every page load
 * and every window focus, that is one refused request per visit per user.
 *
 * The 403 is the server's own answer, so it is kept as one:
 *  - in the query cache, as `ADMIN_ACCESS_DENIED` — data that reads as "no
 *    admin access" everywhere (`normalizeMyPermissions` gives `resolved:
 *    false`), so it is not re-asked on focus or remount;
 *  - in storage, against this exact session token (`sub` + `jti`), so a reload
 *    does not re-ask either.
 *
 * Grants are deliberately not live on this backend: a promotion takes effect on
 * the account's next sign-in. A new sign-in issues a new token — a new `jti` —
 * so the remembered answer no longer matches and the question is asked once.
 *
 * This can only ever *skip a request whose answer was a refusal*. It never
 * grants anything: a missing, edited or foreign marker simply means asking the
 * server again, and an administrator is never recorded here because only a 403
 * writes it.
 */

export const ADMIN_DENIAL_STORAGE_KEY = "adminAccessDenied";

/** The cached answer for a 403. Unwraps to `null`, i.e. no grants at all. */
export const ADMIN_ACCESS_DENIED = Object.freeze({ data: null, adminAccessDenied: true });

const SUBJECT_CLAIMS = [
  "sub",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
];

function claim(claims, names) {
  for (const name of names) {
    const value = claims?.[name];

    if (typeof value === "string" && value) return value;
  }

  return null;
}

/**
 * `sub:jti` for this token, or null when it lacks either — in which case
 * nothing is remembered and the server is simply asked.
 */
export function adminDenialMarker(token) {
  const claims = decodeToken(token);

  const subject = claim(claims, SUBJECT_CLAIMS);

  const tokenId = claim(claims, ["jti"]);

  return subject && tokenId ? `${subject}:${tokenId}` : null;
}

export function isAdminDenial(error) {
  return Number(error?.response?.status) === 403;
}

export function isAdminAccessDenied(data) {
  return data?.adminAccessDenied === true;
}

function defaultStorage() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Was this exact session already refused? Unreadable storage means "ask". */
export function isKnownAdminDenial(marker, storage = defaultStorage()) {
  if (!marker || !storage) return false;

  try {
    return storage.getItem(ADMIN_DENIAL_STORAGE_KEY) === marker;
  } catch {
    return false;
  }
}

/** One marker at a time: the current session's refusal replaces any older one. */
export function rememberAdminDenial(marker, storage = defaultStorage()) {
  if (!marker || !storage) return;

  try {
    storage.setItem(ADMIN_DENIAL_STORAGE_KEY, marker);
  } catch {
    /* Private mode or a full quota: the cache still holds it for this tab. */
  }
}

/**
 * The query function: the server's grants, or `ADMIN_ACCESS_DENIED` when it
 * answers 403. Every other failure is rethrown untouched — a network error or
 * a 5xx is not a refusal and must not be remembered as one.
 */
export async function readAdminPermissions(fetchPermissions, marker, storage) {
  try {
    return await fetchPermissions();
  } catch (error) {
    if (!isAdminDenial(error)) throw error;

    rememberAdminDenial(marker, storage);

    return ADMIN_ACCESS_DENIED;
  }
}
