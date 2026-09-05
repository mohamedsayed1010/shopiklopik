import axiosInstance from "../axiosInstance";

/** Mute or unmute one interest without unfollowing it. */
export async function setInterestEnabled({ id, isEnabled }) {
  const response = await axiosInstance.patch(
    `/api/notifications/interests/${id}`,
    { isEnabled }
  );

  return response.data;
}
