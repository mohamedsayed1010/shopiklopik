/**
 * The screens that exist to get a reader signed in. None of them is ever a
 * destination to return someone to: landing back on the sign-in form after
 * signing in is the loop these flows fall into.
 */
export const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Where a guard was taking the reader before it interrupted them.
 *
 * Only a same-site path is honoured — an absolute URL in router state would be
 * an open redirect — and anything else falls back to the home page. `avoid`
 * takes a path or a list of them, and keeps a destination from pointing back at
 * a screen that would only redirect again.
 *
 * Lifted out of `useLogin`, which has always answered this question, because
 * the profile-completion form now answers the same one when it is done.
 */
export function redirectTarget(from, { fallback = "/", avoid = [] } = {}) {
  const path =
    typeof from === "string"
      ? from
      : from?.pathname
        ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
        : "";

  const safe = path.startsWith("/") && !path.startsWith("//") ? path : fallback;

  const refused = [avoid].flat().filter(Boolean);

  const isRefused = refused.some(
    (entry) =>
      safe === entry ||
      safe.startsWith(`${entry}?`) ||
      safe.startsWith(`${entry}#`) ||
      safe.startsWith(`${entry}/`)
  );

  return isRefused ? fallback : safe;
}

export default redirectTarget;
