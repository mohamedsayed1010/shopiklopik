import axiosInstance from "../axiosInstance";

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
  const params = {};

  if (status !== undefined && status !== null && status !== "") {
    params.status = Number(status);
  }

  const response = await axiosInstance.get(`${BASE}/my`, { params });

  return response.data;
}

/** One payment the signed-in user owns. 404 when it is somebody else's. */
export async function getPaymentDetails(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}
