import axiosInstance from "../axiosInstance";
import { fillPaymentEndpoint } from "../../utils/adPaymentForm";

/* The user-side ad payment API. Every path comes from the create-ad-form
   Lookup (`data.payment`), never from a hardcoded list, so a module enabled
   later works without a frontend change. All calls go through the signed-in
   instance (Bearer + refresh). Only relative `/api/...` paths are accepted, so
   a malformed Lookup can never send the user's token to another host. */

function apiPath(path) {
  if (typeof path !== "string" || !/^\/api\//.test(path)) {
    throw new Error(`Unexpected ad payment endpoint: ${String(path)}`);
  }

  return path;
}

/** `GET /api/v2/ad-payment/config` (the Lookup's `configEndpoint`). Never cached by the server. */
export async function getAdPaymentConfig(configEndpoint) {
  const response = await axiosInstance.get(apiPath(configEndpoint), {
    headers: { "Cache-Control": "no-cache" },
  });

  return response.data;
}

/** `GET /api/v2/ads/{type}/{id}/payment` — owner only (404 for anyone else). */
export async function getAdPaymentStatus({ statusEndpoint, advertisementType, advertisementId }) {
  const url = fillPaymentEndpoint(statusEndpoint, { advertisementType, advertisementId });

  const response = await axiosInstance.get(apiPath(url));

  return response.data;
}

/* `POST /api/v2/ads/{type}/{id}/payment` or `.../payment/resubmit`, multipart.
   `url` and `method` come from `paymentTarget`. The server refuses a duplicate
   (pending or approved payment) with 409, so a retry can never pay twice. */
export async function submitAdPayment({ url, method }, formData, onUploadProgress) {
  const response = await axiosInstance({
    url: apiPath(url),
    method: method || "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

  return response.data;
}
