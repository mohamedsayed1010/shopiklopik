import axiosInstance from "../axiosInstance";

export async function getPublicSettings() {
  const response = await axiosInstance.get("/api/v2/settings");

  return response.data;
}
