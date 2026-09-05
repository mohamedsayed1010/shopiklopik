import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/reports";

function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export function toAdminReportsParams({
  status,
  reason,
  type,
  pageIndex = 1,
  pageSize = 20,
} = {}) {
  return toParams({
    Status: status,
    Reason: reason,
    Type: type,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

export async function getAdminReports(filters) {
  const response = await axiosInstance.get(BASE, {
    params: toAdminReportsParams(filters),
  });

  return response.data;
}

/** Returns `{ reasons, statuses }` — and, deliberately, no action list. */
export async function getAdminReportsMetadata() {
  const response = await axiosInstance.get(`${BASE}/metadata`);

  return response.data;
}

/** Closes the report as unfounded. The reported listing is not touched. */
export async function ignoreAdminReport({ id, note }) {
  const response = await axiosInstance.patch(`${BASE}/${id}/ignore`, {
    note: note ?? null,
  });

  return response.data;
}

export async function actOnAdminReport({ id, note, action }) {
  const response = await axiosInstance.patch(`${BASE}/${id}/action`, {
    note: note ?? null,
    action,
  });

  return response.data;
}

/** Sets status and admin note without deciding anything about the listing. */
export async function updateAdminReport({ id, status, adminNote }) {
  const response = await axiosInstance.put(`${BASE}/${id}`, {
    status,
    adminNote: adminNote ?? null,
  });

  return response.data;
}
