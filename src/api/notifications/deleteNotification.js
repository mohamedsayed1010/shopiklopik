import axiosInstance from "../axiosInstance";

export async function deleteNotification(id) {
  const response = await axiosInstance.delete(
    `/api/notifications/${id}`
  );

  return response.data;
}