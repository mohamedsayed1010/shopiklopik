import axiosInstance from "../axiosInstance";

export async function verifyResetCode(resetToken, otp) {
  const response = await axiosInstance.post(
    "/api/auth/verify-reset-code",
    {
      otp,
    },
    {
      headers: {
        "X-Password-Reset-Token": resetToken,
      },
    }
  );

  return response.data;
}