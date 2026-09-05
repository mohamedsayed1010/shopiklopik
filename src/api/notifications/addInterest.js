import axiosInstance from "../axiosInstance";

export async function addInterest({ categoryId, subCategoryId = null }) {
  const response = await axiosInstance.post("/api/notifications/interests", {
    categoryId,
    subCategoryId: subCategoryId ?? null,
  });

  return response.data;
}
