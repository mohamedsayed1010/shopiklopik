import axiosInstance from "../axiosInstance";

export async function changePassword(data) {
  const response = await axiosInstance.post(
    "/api/profile/change-password",
    data
  );

  return response.data;
}