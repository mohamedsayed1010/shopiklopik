import axiosInstance from "../../axiosInstance";
import {
  isImageBlob,
  readBlobJson,
  toAdPaymentListParams,
} from "../../../utils/adPayment";

const BASE = "/api/v2/admin/ad-payment";

const path = (id) => `${BASE}/submissions/${encodeURIComponent(String(id))}`;

/** `GET /settings` — payments → View. */
export async function getAdPaymentSettings() {
  const response = await axiosInstance.get(`${BASE}/settings`);

  return response.data;
}

/** `PUT /settings` — payments → Edit. `payload` comes from `toSettingsPayload`. */
export async function updateAdPaymentSettings(payload) {
  const response = await axiosInstance.put(`${BASE}/settings`, payload);

  return response.data;
}

/** `GET /submissions` — payments → View. Filters go through `toAdPaymentListParams`. */
export async function getAdPaymentSubmissions(filters) {
  const response = await axiosInstance.get(`${BASE}/submissions`, {
    params: toAdPaymentListParams(filters),
  });

  return response.data;
}

/** `GET /submissions/{paymentSubmissionId}` — payments → View. */
export async function getAdPaymentSubmissionById(paymentSubmissionId) {
  const response = await axiosInstance.get(path(paymentSubmissionId));

  return response.data;
}

/* `GET /submissions/{id}/screenshot` — payments → View. A file, not JSON.

   It goes through the authenticated instance, so the Bearer token and the 401
   refresh flow apply. The URL in `screenshotUrl` is never loaded directly: an
   <img src> could not send the token. Errors arrive as a Blob, so their JSON
   body is parsed back into `error.response.data` and the usual error copy can
   read it. A 200 that is not an image is treated as a failure too. */
export async function getAdPaymentSubmissionScreenshot(paymentSubmissionId) {
  let response;

  try {
    response = await axiosInstance.get(`${path(paymentSubmissionId)}/screenshot`, {
      responseType: "blob",
    });
  } catch (error) {
    if (error?.response && typeof Blob !== "undefined" && error.response.data instanceof Blob) {
      error.response.data = (await readBlobJson(error.response.data)) ?? null;
    }

    throw error;
  }

  const blob = response.data;

  if (isImageBlob(blob)) return blob;

  /* Whatever a 200 carried instead of an image (JSON, HTML, nothing), its text
     is not shown: it was not written as an error message for the admin. */
  const failure = new Error("screenshot: the response was not an image");

  failure.response = {
    status: response.status,
    data: { success: false, message: "لم يُرجع الخادم صورة صالحة لهذا الإيصال.", errors: null },
  };

  failure.notAnImage = true;

  throw failure;
}

/** `PATCH /submissions/{id}/review` — payments → Approve. `body` comes from `toReviewPayload`. */
export async function reviewAdPaymentSubmission({ paymentSubmissionId, body }) {
  const response = await axiosInstance.patch(`${path(paymentSubmissionId)}/review`, body);

  return response.data;
}

/** `GET /history` — payments → View. Read-only. */
export async function getAdPaymentHistory(filters) {
  const response = await axiosInstance.get(`${BASE}/history`, {
    params: toAdPaymentListParams(filters),
  });

  return response.data;
}
