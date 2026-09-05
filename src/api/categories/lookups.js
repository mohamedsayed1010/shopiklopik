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