import axiosInstance from "../axiosInstance";

export async function getInterests() {
  const response = await axiosInstance.get(
    "/api/notifications/interests"
  );

  return response.data;
}
