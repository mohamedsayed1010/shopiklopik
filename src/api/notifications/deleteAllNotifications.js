import axiosInstance from "../axiosInstance";

export async function deleteAllNotifications() {
  const response = await axiosInstance.delete("/api/notifications");

  return response.data;
}
