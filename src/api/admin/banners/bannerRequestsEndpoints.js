import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/banner-requests";

/** Empty values are dropped: `Status=` narrows nothing and pollutes the key. */
function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export async function getAdminBannerCenter() {
  const response = await axiosInstance.get("/api/v2/admin/banner-center");

  return response.data;
}

export function toBannerRequestParams({
  status,
  paymentStatus,
  location,
  categoryId,
  subCategoryId,
  userId,
  search,
  fromDate,
  toDate,
  pageIndex = 1,
  pageSize = 20,
} = {}) {
  return toParams({
    Status: status,
    PaymentStatus: paymentStatus,
    Location: location,
    CategoryId: categoryId,
    SubCategoryId: subCategoryId,
    UserId: userId,
    Search: search,
    FromDate: fromDate,
    ToDate: toDate,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

export async function getAdminBannerRequests(filters) {
  const response = await axiosInstance.get(BASE, {
    params: toBannerRequestParams(filters),
  });

  return response.data;
}

export async function getAdminBannerRequest(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

export async function getAdminBannerAvailability({
  location,
  categoryId,
  subCategoryId,
} = {}) {
  const response = await axiosInstance.get(`${BASE}/availability`, {
    params: toParams({
      Location: location,
      CategoryId: categoryId,
      SubCategoryId: subCategoryId,
    }),
  });

  return response.data;
}

export async function getBannerRequestStatuses() {
  const response = await axiosInstance.get(`${BASE}/statuses`);

  return response.data;
}

export async function getBannerRejectionReasons() {
  const response = await axiosInstance.get(`${BASE}/rejection-reasons`);

  return response.data;
}

/** Payment accepted. No request body — the contract takes none. */
export async function approveBannerPayment(id) {
  const response = await axiosInstance.patch(`${BASE}/${id}/approve-payment`);

  return response.data;
}

/** Payment refused. `notes` is the only field the contract declares. */
export async function rejectBannerPayment({ id, notes }) {
  const response = await axiosInstance.patch(`${BASE}/${id}/reject-payment`, {
    notes: String(notes ?? "").trim(),
  });

  return response.data;
}

export async function approveBannerRequest(id) {
  const response = await axiosInstance.patch(`${BASE}/${id}/approve`);

  return response.data;
}

export async function rejectBannerRequest({ id, reason, notes }) {
  const body = { reason: Number(reason) };

  const text = String(notes ?? "").trim();

  if (text) body.notes = text;

  const response = await axiosInstance.patch(`${BASE}/${id}/reject`, body);

  return response.data;
}

/** End a live banner early. No request body. */
export async function expireBannerRequest(id) {
  const response = await axiosInstance.patch(`${BASE}/${id}/expire`);

  return response.data;
}

export async function deleteBannerRequest(id) {
  const response = await axiosInstance.delete(`${BASE}/${id}`);

  return response.data;
}
