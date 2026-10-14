import axiosInstance from "../../axiosInstance";

/* Checked live on 2026-10-14. Every category carries its subcategories inline
   (`subCategories`), but their `adsCount` comes back 0 on this endpoint even
   where the category's own count and `GET /subcategories/{id}` are not — so
   a subcategory's count is read from its details, never from this list. */
export async function getAdminCategories() {
  const response = await axiosInstance.get("/api/v2/admin/categories");

  return response.data;
}

const SUB_BASE = "/api/v2/admin/subcategories";

export async function getAdminSubCategory(id) {
  const response = await axiosInstance.get(`${SUB_BASE}/${id}`);

  return response.data;
}

/** Whether it may go is the server's call (409 when records still use it). */
export async function deleteAdminSubCategory(id) {
  const response = await axiosInstance.delete(`${SUB_BASE}/${id}`);

  return response.data;
}

/** Activate / deactivate. Answers with the updated subcategory. */
export async function updateAdminSubCategoryStatus({ id, isActive }) {
  const response = await axiosInstance.patch(`${SUB_BASE}/${id}/status`, {
    isActive: Boolean(isActive),
  });

  return response.data;
}
