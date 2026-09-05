import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/feedback";

/** One page of ratings. Paging is the server's; nothing is narrowed locally. */
export async function getAdminFeedback({ pageIndex = 1, pageSize = 20 } = {}) {
  const response = await axiosInstance.get(BASE, {
    params: { PageIndex: pageIndex, PageSize: pageSize },
  });

  return response.data;
}

export async function getAdminFeedbackDetails(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

/** Remove a rating. Irreversible, so the UI confirms before calling this. */
export async function deleteAdminFeedback(id) {
  const response = await axiosInstance.delete(`${BASE}/${id}`);

  return response.data;
}
