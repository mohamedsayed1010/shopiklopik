import axiosInstance from "../axiosInstance";

export async function getPreferences() {
  const response = await axiosInstance.get(
    "/api/notifications/preferences"
  );

  return response.data;
}
