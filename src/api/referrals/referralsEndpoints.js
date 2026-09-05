import axiosInstance from "../axiosInstance";

const BASE = "/api/referrals";

function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export function toMyReferredUsersParams({
  status,
  pageIndex = 1,
  pageSize = 10,
} = {}) {
  return toParams({
    Status: status,
    PageIndex: pageIndex,
    PageSize: pageSize,
  });
}

/** The caller's own referral record: code, link and totals. */
export async function getMyReferral() {
  const response = await axiosInstance.get(`${BASE}/me`);

  return response.data;
}

/** The caller's counts, including the day/week/month breakdown. */
export async function getMyReferralStatistics() {
  const response = await axiosInstance.get(`${BASE}/me/statistics`);

  return response.data;
}

/** One page of the people who joined through the caller's code. */
export async function getMyReferredUsers(filters) {
  const response = await axiosInstance.get(`${BASE}/me/users`, {
    params: toMyReferredUsersParams(filters),
  });

  return response.data;
}

export async function resolveReferralCode(code) {
  const response = await axiosInstance.get(
    `${BASE}/resolve/${encodeURIComponent(code)}`
  );

  return response.data;
}
