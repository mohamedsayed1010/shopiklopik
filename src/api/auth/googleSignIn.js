import axiosInstance from "../axiosInstance";

/**
 * Exchange Google's ID token for this site's own session. Answers with the same
 * `AuthResponse` envelope as `/api/auth/login`, so the caller stores it through
 * the same `AuthContext.login` — see `useGoogleSignIn`.
 *
 * `GoogleSignInRequest` also publishes `code` + `redirectUri`, but that half is
 * switched off on this backend: posting a `code` answers "الدخول بحساب جوجل مش
 * متاح دلوقتي", while an `idToken` reaches Google's own token validation. So
 * the ID-token flow is the one wired here.
 *
 * `center` is accepted and validated against the centres lookup; the sign-in
 * form has no centre to offer, so it is left to the profile-completion step.
 */
export async function googleSignIn({ idToken, referralCode } = {}) {
  const payload = { idToken };

  /* Only when the invitation link actually carried one — an empty string is a
     referral code the backend would have to reject. */
  if (referralCode) payload.referralCode = referralCode;

  const response = await axiosInstance.post("/api/auth/google", payload);

  return response.data;
}

export default googleSignIn;
