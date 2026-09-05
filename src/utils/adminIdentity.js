
const ROLE_CLAIMS = [
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  "role",
  "roles",
];

const ADMIN_ROLE = "admin";

/** Decode a JWT payload. Returns null for anything that is not one. */
export function decodeToken(token) {
  if (typeof token !== "string") return null;

  const payload = token.split(".")[1];

  if (!payload) return null;

  try {
    // base64url -> base64, then through TextDecoder so Arabic claims survive.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));

    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0)
    );

    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** Every role the token claims, lowercased. A claim may be a string or array. */
export function rolesFromToken(token) {
  const claims = decodeToken(token);

  if (!claims) return [];

  return ROLE_CLAIMS.flatMap((claim) => {
    const value = claims[claim];

    if (!value) return [];

    return (Array.isArray(value) ? value : [value])
      .filter((entry) => typeof entry === "string")
      .map((entry) => entry.toLowerCase());
  });
}

/** The token's expiry as epoch milliseconds, or null when it declares none. */
export function tokenExpiresAt(token) {
  const exp = decodeToken(token)?.exp;

  return typeof exp === "number" ? exp * 1000 : null;
}

export function isAdminToken(token) {
  if (!token) return false;

  const expiresAt = tokenExpiresAt(token);

  if (expiresAt !== null && expiresAt <= Date.now()) return false;

  return rolesFromToken(token).includes(ADMIN_ROLE);
}
