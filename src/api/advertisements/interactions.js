import axiosInstance from "../axiosInstance";

export async function getListingInteractionMetadata() {
  const response = await axiosInstance.get("/api/advertisements/metadata");

  return response.data;
}

export async function recordAdvertisementView(id, type) {
  const response = await axiosInstance.post(
    `/api/advertisements/${id}/view`,
    {},
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}

export async function getAdvertisementActions(id, type) {
  const response = await axiosInstance.get(
    `/api/advertisements/${id}/actions`,
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}

export async function reportAdvertisement(id, { type, reason, details } = {}) {
  const response = await axiosInstance.post(`/api/advertisements/${id}/report`, {
    ...(Number.isFinite(type) ? { type } : {}),
    reason,
    details: typeof details === "string" ? details : "",
  });

  return response.data;
}

export async function getSimilarAdvertisements(
  id,
  { pageIndex = 1, pageSize = 12, type } = {}
) {
  const response = await axiosInstance.get(`/api/advertisements/${id}/similar`, {
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
      ...(Number.isFinite(type) ? { Type: type } : {}),
    },
  });

  return response.data;
}

export async function addFavorite(id, type) {
  const response = await axiosInstance.post(
    `/api/advertisements/${id}/favorite`,
    {},
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}

export async function removeFavorite(id, type) {
  const response = await axiosInstance.delete(
    `/api/advertisements/${id}/favorite`,
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}

export async function getFavorites({ pageIndex = 1, pageSize = 12, type } = {}) {
  const response = await axiosInstance.get("/api/advertisements/favorites", {
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
      ...(Number.isFinite(type) ? { Type: type } : {}),
    },
  });

  return response.data;
}

export async function getRecentlyViewed({
  pageIndex = 1,
  pageSize = 12,
  type,
} = {}) {
  const response = await axiosInstance.get("/api/advertisements/recently-viewed", {
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
      ...(Number.isFinite(type) ? { type } : {}),
    },
  });

  return response.data;
}

export async function removeRecentlyViewed(id, type) {
  const response = await axiosInstance.delete(
    `/api/advertisements/${id}/recently-viewed`,
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}

export async function clearRecentlyViewed(type) {
  const response = await axiosInstance.delete(
    "/api/advertisements/recently-viewed",
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}
