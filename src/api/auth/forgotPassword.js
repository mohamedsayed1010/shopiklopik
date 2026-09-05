import axiosInstance from "../axiosInstance";

export async function forgotPassword(data) {
  const response = await axiosInstance.post(
    "/api/auth/forgot-password",
    data
  );

  return response.data;
}