import axiosInstance from "../axiosInstance";

const BASE = "/api/banner-bookings";

function toParams(values) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export async function getBannerAvailability({
  location,
  categoryId,
  subCategoryId,
}) {
  const response = await axiosInstance.get(`${BASE}/availability`, {
    params: toParams({
      Location: location,
      CategoryId: categoryId,
      SubCategoryId: subCategoryId,
    }),
  });

  return response.data;
}

/** The payment methods a banner may be paid with, plus their copy hints. */
export async function getBannerPaymentMethods() {
  const response = await axiosInstance.get(`${BASE}/payment-methods`);

  return response.data;
}

export async function getBannerQuote({
  location,
  slotNumber,
  categoryId,
  subCategoryId,
  paymentMethodId,
}) {
  const response = await axiosInstance.get(`${BASE}/quote`, {
    params: toParams({
      Location: location,
      SlotNumber: slotNumber,
      CategoryId: categoryId,
      SubCategoryId: subCategoryId,
      PaymentMethodId: paymentMethodId,
    }),
  });

  return response.data;
}

export async function previewBannerImages({ location, desktopImage, mobileImage }) {
  const formData = new FormData();

  formData.append("Location", String(location));

  if (desktopImage) formData.append("DesktopImage", desktopImage);

  if (mobileImage) formData.append("MobileImage", mobileImage);

  const response = await axiosInstance.post(`${BASE}/preview`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function createBannerBooking(values, onUploadProgress) {
  const formData = new FormData();

  formData.append("DesktopImage", values.desktopImage);

  formData.append("MobileImage", values.mobileImage);

  formData.append("Title", String(values.title ?? "").trim());

  const description = String(values.description ?? "").trim();

  if (description) formData.append("Description", description);

  /* Required by the server (confirmed: omitting either answers 422 with
     "نص الزر مطلوب" / "رابط الإعلان مطلوب"), so both are always sent. */
  formData.append("ButtonText", String(values.buttonText ?? "").trim());

  formData.append("TargetUrl", String(values.targetUrl ?? "").trim());

  formData.append("Location", String(values.location));

  formData.append("SlotNumber", String(values.slotNumber));

  if (values.categoryId) formData.append("CategoryId", String(values.categoryId));

  if (values.subCategoryId) {
    formData.append("SubCategoryId", String(values.subCategoryId));
  }

  formData.append("AdvertiserName", String(values.advertiserName ?? "").trim());

  formData.append("PhoneNumber", String(values.phoneNumber ?? "").trim());

  const whatsApp = String(values.whatsAppNumber ?? "").trim();

  if (whatsApp) formData.append("WhatsAppNumber", whatsApp);

  const email = String(values.email ?? "").trim();

  if (email) formData.append("Email", email);

  formData.append("PaymentMethodId", String(values.paymentMethodId));

  formData.append("PaymentProof", values.paymentProof);

  formData.append("ConfirmationAccepted", String(Boolean(values.confirmationAccepted)));

  const response = await axiosInstance.post(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

  return response.data;
}

export async function getMyBannerBookings({ status } = {}) {
  const response = await axiosInstance.get(`${BASE}/my`, {
    params: toParams({ status }),
  });

  return response.data;
}

export async function getBannerBooking(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

export async function cancelBannerBooking(id) {
  const response = await axiosInstance.post(`${BASE}/${id}/cancel`, {});

  return response.data;
}
