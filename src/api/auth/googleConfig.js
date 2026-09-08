import axiosInstance from "../axiosInstance";

/**
 * The Google client this deployment signs in against — `{ enabled, clientId }`
 * inside the usual envelope.
 *
 * The client id is deliberately not a build-time constant: it belongs to the
 * deployment the API answers for, and reading it from the API is what keeps the
 * two from drifting apart. The client *secret* never leaves the server; nothing
 * in this flow needs it.
 */
export async function getGoogleAuthConfig() {
  const response = await axiosInstance.get("/api/auth/google/config");

  return response.data;
}

export default getGoogleAuthConfig;
