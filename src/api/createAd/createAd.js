import axiosInstance from "../axiosInstance";


export async function getCreateAdForm(
  categoryId,
  subCategoryId
) {

  const response = await axiosInstance.get(
    `/api/lookups/create-ad-form/${categoryId}/${subCategoryId}`
  );


  return response.data;
}