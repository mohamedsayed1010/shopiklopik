import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/ads";

/** Strip anything the caller left unset so the query string stays minimal. */
function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export function toAdminAdsParams({
  search,
  categoryId,
  subCategoryId,
  type,
  moderationStatus,
  status,
  fromDate,
  toDate,
  ownerId,
  pageIndex = 1,
  pageSize = 10,
} = {}) {
  return toParams({
    Search: search,
    CategoryId: categoryId,
    SubCategoryId: subCategoryId,
    Type: type,
    ModerationStatus: moderationStatus,
    Status: status,
    FromDate: fromDate,
    ToDate: toDate,
    OwnerId: ownerId,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

export async function getAdminAds(filters) {
  const response = await axiosInstance.get(BASE, {
    params: toAdminAdsParams(filters),
  });

  return response.data;
}

export async function getAdminPendingAds(filters) {
  const response = await axiosInstance.get(`${BASE}/pending`, {
    params: toAdminAdsParams(filters),
  });

  return response.data;
}

export async function getAdminPendingCount() {
  const response = await axiosInstance.get(`${BASE}/pending/count`);

  return response.data;
}

/** Moderation statuses, rejection reasons and every listing module. */
export async function getAdminAdsMetadata() {
  const response = await axiosInstance.get(`${BASE}/metadata`);

  return response.data;
}

export async function getAdminAdDetails({ type, id }) {
  const response = await axiosInstance.get(`${BASE}/${type}/${id}`);

  return response.data;
}

export async function approveAdminAd({ type, id, notes }) {
  const response = await axiosInstance.patch(`${BASE}/${type}/${id}/approve`, {
    notes: notes ?? null,
  });

  return response.data;
}

/** `reason` is a `ListingRejectionReason` id from `metadata.rejectionReasons`. */
export async function rejectAdminAd({ type, id, reason, notes }) {
  const response = await axiosInstance.patch(`${BASE}/${type}/${id}/reject`, {
    reason,
    notes: notes ?? null,
  });

  return response.data;
}

export async function suspendAdminAd({ type, id, notes }) {
  const response = await axiosInstance.patch(`${BASE}/${type}/${id}/suspend`, {
    notes: notes ?? null,
  });

  return response.data;
}

export async function deleteAdminAd({ type, id }) {
  const response = await axiosInstance.delete(`${BASE}/${type}/${id}`);

  return response.data;
}
