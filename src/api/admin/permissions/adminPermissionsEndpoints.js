import axiosInstance from "../../axiosInstance";

export async function getAdminPermissionPages() {
  const response = await axiosInstance.get("/api/v2/admin/permissions/pages");

  return response.data;
}

export async function getMyAdminPermissions() {
  const response = await axiosInstance.get("/api/v2/admin/me/permissions");

  return response.data;
}
