import axiosInstance from "../axiosInstance";
import { myPaymentsParams } from "../../utils/paymentFilters";

const BASE = "/api/payments";

export async function getPaymentMethods() {
  const response = await axiosInstance.get(`${BASE}/methods`);

  const methods = response.data?.data;

  if (Array.isArray(methods)) {
    response.data.data = [...methods].sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0)
    );
  }

  return response.data;
}

export async function createPayment(
  { paymentMethodId, amount, screenshot, notes },
  onUploadProgress
) {
  const formData = new FormData();

  formData.append("PaymentMethodId", String(paymentMethodId));

  formData.append("Amount", String(amount));

  formData.append("Screenshot", screenshot);

  const trimmedNotes = typeof notes === "string" ? notes.trim() : "";

  if (trimmedNotes) formData.append("Notes", trimmedNotes);

  const response = await axiosInstance.post(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

  return response.data;
}

export async function getMyPayments({ status } = {}) {
  /* Same reading as the query key (`myPaymentsKey`), so two calls that share a
     cache entry always send the same request. */
  const params = myPaymentsParams(status);

  const response = await axiosInstance.get(`${BASE}/my`, { params });

  return response.data;
}

/** One payment the signed-in user owns. 404 when it is somebody else's. */
export async function getPaymentDetails(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

/* The receipt of one of the user's own payments. `screenshotUrl` points at
   `/api/payments/{id}/screenshot`, which answers 401 without the Bearer token,
   so it can never be an <img src>: it is fetched here, through the
   authenticated instance (token + refresh), as a Blob. A JSON error body that
   arrived as a Blob is decoded back into `error.response.data`; a 200 that is
   not an image is a failure too. */
export async function getPaymentScreenshot(url) {
  let response;

  try {
    response = await axiosInstance.get(url, { responseType: "blob" });
  } catch (error) {
    const body = error?.response?.data;

    if (body && typeof body.text === "function") {
      try {
        error.response.data = JSON.parse(await body.text());
      } catch {
        error.response.data = null;
      }
    }

    throw error;
  }

  const blob = response.data;

  if (blob && blob.size > 0 && /^image\//i.test(blob.type ?? "")) return blob;

  throw Object.assign(new Error("payment screenshot: the response was not an image"), {
    notAnImage: true,
    response: { status: response.status, data: null },
  });
}
