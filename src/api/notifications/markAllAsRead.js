import axiosInstance from "../axiosInstance";

export async function markAllAsRead() {
  const response = await axiosInstance.patch(
    "/api/notifications/read-all"
  );

  return response.data;
}