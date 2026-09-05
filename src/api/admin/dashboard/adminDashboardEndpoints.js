import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/dashboard";

/** `latest` caps each of the three recent lists. The server defaults it to 5. */
export async function getAdminDashboard({ latest = 5 } = {}) {
  const response = await axiosInstance.get(BASE, { params: { latest } });

  return response.data;
}

export async function getAdminAnalytics({ from, to } = {}) {
  const params = {};

  if (from) params.from = from;

  if (to) params.to = to;

  const response = await axiosInstance.get(`${BASE}/analytics`, { params });

  return response.data;
}
