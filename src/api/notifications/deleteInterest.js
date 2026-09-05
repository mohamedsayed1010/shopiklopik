import axiosInstance from "../axiosInstance";

/** `id` is the `interestId` the server reported — never constructed here. */
export async function deleteInterest(id) {
  const response = await axiosInstance.delete(
    `/api/notifications/interests/${id}`
  );

  return response.data;
}
