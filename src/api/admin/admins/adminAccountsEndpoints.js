import axiosInstance from "../../axiosInstance";
import { toPagesPayload } from "../../../utils/adminPermissions";
import { adminAccountSelection } from "../../../utils/adminAccountPages";

const BASE = "/api/v2/admin/admins";

function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export function toAdminAccountsParams({
  search,
  isActive,
  pageIndex = 1,
  pageSize = 20,
} = {}) {
  return toParams({
    Search: search,
    IsActive: isActive,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

export async function getAdminAccounts(filters) {
  const response = await axiosInstance.get(BASE, {
    params: toAdminAccountsParams(filters),
  });

  return response.data;
}

export async function getAdminAccountDetails(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

export function toAdminCandidatesParams({ q, excludeAdmins, limit } = {}) {
  return toParams({
    Q: q,
    ExcludeAdmins: excludeAdmins,
    Limit: limit,
  });
}

export async function getAdminCandidates(params) {
  const response = await axiosInstance.get(`${BASE}/candidates`, {
    params: toAdminCandidatesParams(params),
  });

  return response.data;
}

/** One candidate, to confirm the selection before it is submitted. */
export async function getAdminCandidate(userId) {
  const response = await axiosInstance.get(`${BASE}/candidates/${userId}`);

  return response.data;
}

export async function createAdminAccount({ userId, pages }) {
  const response = await axiosInstance.post(BASE, {
    userId,
    pages: toPagesPayload(adminAccountSelection(pages)),
  });

  return response.data;
}

export async function deleteAdminAccount(id) {
  const response = await axiosInstance.delete(`${BASE}/${id}`);

  return response.data;
}

/** Activate / deactivate. The reason is sent as null rather than as "". */
export async function updateAdminAccountStatus({ id, isActive, reason }) {
  const response = await axiosInstance.patch(`${BASE}/${id}/status`, {
    isActive: Boolean(isActive),
    reason: reason ?? null,
  });

  return response.data;
}

/** Replace the account's page grants wholesale — the contract is a full set. */
export async function updateAdminAccountPermissions({ id, pages }) {
  const response = await axiosInstance.put(`${BASE}/${id}/permissions`, {
    pages: toPagesPayload(adminAccountSelection(pages)),
  });

  return response.data;
}
