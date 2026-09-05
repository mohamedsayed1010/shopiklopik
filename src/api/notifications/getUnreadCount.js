import axiosInstance from "../axiosInstance";

export async function getUnreadCount() {
  const response = await axiosInstance.get(
    "/api/notifications/unread-count"
  );

  return response.data;
}