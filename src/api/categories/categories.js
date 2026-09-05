import axiosInstance from "../axiosInstance";

export async function getCategoriesTree() {
  const response = await axiosInstance.get(
    "/api/lookups/categories-tree"
  );

  return response.data;
}