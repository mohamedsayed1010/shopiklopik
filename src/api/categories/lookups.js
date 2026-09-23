import axiosInstance from "../axiosInstance";

export async function getReadConfig(categoryId, subCategoryId) {
  const response = await axiosInstance.get(
    `/api/lookups/read-config/${categoryId}/${subCategoryId}`
  );

  return response.data;
}

export async function getGovernorates() {
  const response = await axiosInstance.get("/api/lookups/governorates");

  return response.data;
}

export async function getCenters(governorateId) {
  const response = await axiosInstance.get(
    `/api/lookups/centers/${governorateId}`
  );

  return response.data;
}

/** One page of the advertisers who list in a sub-category. `search` is
    optional; an empty one is not sent. */
export async function getAdvertisers(
  categoryId,
  subCategoryId,
  { search = "", pageIndex = 1, pageSize = 20 } = {}
) {
  const term = String(search ?? "").trim();

  const response = await axiosInstance.get(
    `/api/lookups/advertisers/${categoryId}/${subCategoryId}`,
    {
      params: {
        ...(term ? { search: term } : {}),
        pageIndex,
        pageSize,
      },
    }
  );

  return response.data;
}
