import axiosInstance from "../axiosInstance";

export async function getNotifications({
  unreadOnly ,
  pageIndex ,
  pageSize ,
}) {
  const response = await axiosInstance.get("/api/notifications", {
    params: {
      UnreadOnly: unreadOnly,
      PageIndex: pageIndex,
      PageSize: pageSize,
    },
  });

  return response.data;
}