import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/users";

function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export function toAdminUsersParams({
  search,
  status,
  isAdmin,
  fromDate,
  toDate,
  pageIndex = 1,
  pageSize = 20,
} = {}) {
  return toParams({
    Search: search,
    // `UserAccountStatus` — the ids come from `/users/statuses`, never from here.
    Status: status,
    // A boolean tri-state: true, false, or absent for "either".
    IsAdmin: isAdmin,
    FromDate: fromDate,
    ToDate: toDate,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

export async function getAdminUsers(filters) {
  const response = await axiosInstance.get(BASE, {
    params: toAdminUsersParams(filters),
  });

  return response.data;
}

export async function getAdminUserDetails(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

export async function getAdminUserStatuses() {
  const response = await axiosInstance.get(`${BASE}/statuses`);

  return response.data;
}

/** Answers with the full updated `AdminUserDetailsDto`, not just an ack. */
export async function updateAdminUserStatus({ id, status, reason }) {
  const response = await axiosInstance.put(`${BASE}/${id}/status`, {
    status,
    reason: reason ?? null,
  });

  return response.data;
}
