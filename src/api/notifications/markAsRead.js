import axiosInstance from "../axiosInstance";

export async function markAsRead(id) {
  const response = await axiosInstance.patch(
    `/api/notifications/${id}/read`
  );

  return response.data;
}