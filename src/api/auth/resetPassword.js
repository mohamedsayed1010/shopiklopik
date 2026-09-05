import axiosInstance from "../axiosInstance";

export async function resetPassword(resetToken, data) {
  const response = await axiosInstance.post(
    "/api/auth/reset-password",
    data,
    {
      headers: {
        "X-Password-Reset-Token": resetToken,
      },
    }
  );

  return response.data;
}