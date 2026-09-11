import axiosInstance from "../axiosInstance";

/**
 * Deactivate the signed-in account — `DELETE /api/account`.
 *
 * The body travels in axios's `data`, the only place a DELETE carries one; the
 * password never goes near the URL. The bearer token comes from the shared
 * instance like every other authenticated call.
 *
 * Two refusals happen before the wire, so no caller can send this by accident:
 * an unconfirmed request, and a request with no session to send it from. The
 * form already prevents both — these are the floor under it.
 */
export async function deleteAccount({ confirm, password, reason } = {}) {
  if (confirm !== true) {
    throw new Error("Account deletion was not confirmed.");
  }

  if (!localStorage.getItem("accessToken")) {
    throw new Error("Account deletion requires a signed-in session.");
  }

  const payload = { confirm: true, password };

  /* `reason` is optional and nullable — an empty one is left out rather than
     sent as a blank string. */
  const note = typeof reason === "string" ? reason.trim() : "";

  if (note) payload.reason = note;

  const response = await axiosInstance.delete("/api/account", { data: payload });

  /* A 200 that still says it failed is not a deactivation, and must never be
     the reason a session is ended. */
  if (response.data?.success === false) throw response.data;

  return response.data;
}

export default deleteAccount;
