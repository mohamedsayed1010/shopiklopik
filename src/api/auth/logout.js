import axiosInstance from "../axiosInstance";

export async function logoutUser() {
  const response = await axiosInstance.post("/api/auth/logout");

  return response.data;
}