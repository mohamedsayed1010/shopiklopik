
export const KNOWN_CODE_PARAMS = [
  "ref",
  "referral",
  "referralCode",
  "referral_code",
  "invite",
  "inviteCode",
  "code",
];

/** The code carried by a query string, or `null` when it carries none. */
export function referralCodeFromSearch(search) {
  const params = new URLSearchParams(search ?? "");

  for (const name of KNOWN_CODE_PARAMS) {
    const value = params.get(name);

    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

export function referralCodeFromUrl(url) {
  if (typeof url !== "string" || !url.trim()) return null;

  try {
    return referralCodeFromSearch(new URL(url, window.location.origin).search);
  } catch {
    return null;
  }
}

export function withoutReferralCode(search) {
  const params = new URLSearchParams(search ?? "");

  KNOWN_CODE_PARAMS.forEach((name) => params.delete(name));

  const rest = params.toString();

  return rest ? `?${rest}` : "";
}
