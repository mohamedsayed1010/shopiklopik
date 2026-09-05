import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/audit-logs";

function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export function toAuditLogsParams({
  search,
  adminUserId,
  action,
  targetType,
  targetId,
  dateFrom,
  dateTo,
  sort,
  pageIndex = 1,
  pageSize = 20,
} = {}) {
  return toParams({
    Search: search,
    AdminUserId: adminUserId,
    Action: action,
    TargetType: targetType,
    TargetId: targetId,
    DateFrom: dateFrom,
    DateTo: dateTo,
    Sort: sort,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

export async function getAdminAuditLogs(filters) {
  const response = await axiosInstance.get(BASE, {
    params: toAuditLogsParams(filters),
  });

  return response.data;
}

export async function getAdminAuditLogDetails(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

/** Actions, target types and the admins who have actually recorded entries. */
export async function getAdminAuditMetadata() {
  const response = await axiosInstance.get(`${BASE}/metadata`);

  return response.data;
}
