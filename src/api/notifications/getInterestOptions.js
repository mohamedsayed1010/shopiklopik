import axiosInstance from "../axiosInstance";

export async function getInterestOptions() {
  const response = await axiosInstance.get(
    "/api/notifications/interests/options"
  );

  return response.data;
}
