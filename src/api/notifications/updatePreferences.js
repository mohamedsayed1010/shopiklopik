import axiosInstance from "../axiosInstance";

/** The contract exposes exactly one preference; nothing else is sent. */
export async function updatePreferences({ newListingsEnabled }) {
  const response = await axiosInstance.put("/api/notifications/preferences", {
    newListingsEnabled,
  });

  return response.data;
}
