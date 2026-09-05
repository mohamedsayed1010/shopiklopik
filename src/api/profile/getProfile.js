import axiosInstance from "../axiosInstance";

export async function getProfile() {
  const response = await axiosInstance.get("/api/profile");

  return response.data;
}