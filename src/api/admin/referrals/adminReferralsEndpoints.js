import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/referrals";

const USERS_BASE = "/api/v2/admin/users";

function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export function toAdminReferralsParams({
  search,
  referrerUserId,
  referredUserId,
  referralCode,
  status,
  fromDate,
  toDate,
  pageIndex = 1,
  pageSize = 20,
} = {}) {
  return toParams({
    Search: search,
    ReferrerUserId: referrerUserId,
    ReferredUserId: referredUserId,
    ReferralCode: referralCode,
    Status: status,
    FromDate: fromDate,
    ToDate: toDate,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

export async function getAdminReferrals(filters) {
  const response = await axiosInstance.get(BASE, {
    params: toAdminReferralsParams(filters),
  });

  return response.data;
}

export async function getAdminReferralStatistics({ top = 5 } = {}) {
  const response = await axiosInstance.get(`${BASE}/statistics`, {
    params: toParams({ top }),
  });

  return response.data;
}

export function toAdminReferrersParams({
  search,
  userId,
  minimumReferrals,
  sortBy,
  pageIndex = 1,
  pageSize = 20,
} = {}) {
  return toParams({
    Search: search,
    UserId: userId,
    MinimumReferrals: minimumReferrals,
    SortBy: sortBy,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

export async function getAdminReferrers(filters) {
  const response = await axiosInstance.get(`${BASE}/referrers`, {
    params: toAdminReferrersParams(filters),
  });

  return response.data;
}

/** `{ id, name, requiresNotes }` — the source of truth for status options. */
export async function getAdminReferralStatuses() {
  const response = await axiosInstance.get(`${BASE}/statuses`);

  return response.data;
}

export async function getAdminReferralDetails(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

export async function getAdminUserReferrals({ userId, filters }) {
  const response = await axiosInstance.get(`${USERS_BASE}/${userId}/referrals`, {
    params: toAdminReferralsParams(filters),
  });

  return response.data;
}
