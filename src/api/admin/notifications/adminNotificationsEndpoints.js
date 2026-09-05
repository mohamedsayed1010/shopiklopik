import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/notifications";

/** Empty values are dropped: `UnreadOnly=` narrows nothing and pollutes the key. */
function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export async function getAdminNotifications({
  unreadOnly,
  pageIndex,
  pageSize,
} = {}) {
  const response = await axiosInstance.get(BASE, {
    params: toParams({
      UnreadOnly: unreadOnly,
      PageIndex: pageIndex,
      PageSize: pageSize,
    }),
  });

  return response.data;
}

/** The badge total. `data` is the number itself, as on the user endpoint. */
export async function getAdminUnreadCount() {
  const response = await axiosInstance.get(`${BASE}/unread-count`);

  return response.data;
}

export async function markAdminNotificationAsRead(id) {
  const response = await axiosInstance.patch(`${BASE}/${id}/read`);

  return response.data;
}

export async function markAllAdminNotificationsAsRead() {
  const response = await axiosInstance.patch(`${BASE}/read-all`);

  return response.data;
}

export async function deleteAdminNotification(id) {
  const response = await axiosInstance.delete(`${BASE}/${id}`);

  return response.data;
}
