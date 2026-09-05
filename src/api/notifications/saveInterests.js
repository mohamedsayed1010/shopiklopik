import axiosInstance from "../axiosInstance";

export async function saveInterests({ interests, newListingsEnabled }) {
  const response = await axiosInstance.put("/api/notifications/interests", {
    interests: (interests ?? []).map(({ categoryId, subCategoryId }) => ({
      categoryId,
      subCategoryId: subCategoryId ?? null,
    })),
    newListingsEnabled,
  });

  return response.data;
}
