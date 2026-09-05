import axiosInstance from "../axiosInstance";

export async function getAdvertisementRating(id, type) {
  const response = await axiosInstance.get(
    `/api/advertisements/${id}/rating`,
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}

export async function rateAdvertisement(id, { type, rating } = {}) {
  const response = await axiosInstance.post(
    `/api/advertisements/${id}/rating`,
    { rating },
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}

export async function removeAdvertisementRating(id, type) {
  const response = await axiosInstance.delete(
    `/api/advertisements/${id}/rating`,
    Number.isFinite(type) ? { params: { type } } : undefined
  );

  return response.data;
}

export async function getAdvertisementRatings(
  id,
  { type, rating, pageIndex = 1, pageSize = 10 } = {}
) {
  const response = await axiosInstance.get(`/api/advertisements/${id}/ratings`, {
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
      ...(Number.isFinite(type) ? { type } : {}),
      ...(Number.isFinite(rating) ? { Rating: rating } : {}),
    },
  });

  return response.data;
}

export async function getMyAdvertisementRatings({
  pageIndex = 1,
  pageSize = 10,
} = {}) {
  const response = await axiosInstance.get("/api/advertisements/ratings/my", {
    params: { PageIndex: pageIndex, PageSize: pageSize },
  });

  return response.data;
}
