
import { apiErrorText } from "../../utils/apiErrors";

export const PROFILE_QUERY_KEY = ["profile"];

export const MY_LISTINGS_QUERY_KEY = ["my-listings"];

/** Merge a UserDto onto the cached ProfileDto without losing `statistics`. */
export function mergeProfileCache(queryClient, user) {
  if (!user) return;

  queryClient.setQueryData(PROFILE_QUERY_KEY, (previous) => {
    if (!previous?.data) return previous;

    return { ...previous, data: { ...previous.data, ...user } };
  });
}

export function mergeStoredUser(user) {
  if (!user) return;

  try {
    const stored = JSON.parse(localStorage.getItem("user") || "null");

    localStorage.setItem("user", JSON.stringify({ ...(stored ?? {}), ...user }));
  } catch {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

/** Prefer the server's own wording; fall back only when it sends none. */
export function apiMessage(payload, fallback) {
  const message = payload?.message;

  return typeof message === "string" && message.trim() ? message : fallback;
}

export function apiError(error, fallback) {
  return apiErrorText(error, fallback);
}
