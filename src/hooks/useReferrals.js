import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getMyReferral,
  getMyReferralStatistics,
  getMyReferredUsers,
  resolveReferralCode,
} from "../api/referrals/referralsEndpoints";

export const REFERRALS_ROOT = ["referrals"];

export const myReferralKey = () => [...REFERRALS_ROOT, "me"];

export const myReferralStatisticsKey = () => [...REFERRALS_ROOT, "statistics"];

export const myReferredUsersKey = (filters) => [
  ...REFERRALS_ROOT,
  "users",
  filters,
];

export const resolveReferralKey = (code) => [
  ...REFERRALS_ROOT,
  "resolve",
  String(code ?? ""),
];

export const referralRetry = (failureCount, error) => {
  const status = error?.response?.status;

  if (status === 401 || status === 403 || status === 404) return false;

  if (status === 429) return failureCount < 1;

  return failureCount < 2;
};

export function useMyReferral({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: myReferralKey(),
    queryFn: getMyReferral,
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: referralRetry,
    refetchOnWindowFocus: false,
  });

  return { referralQuery: query, referral: query.data?.data ?? null };
}

/** The counts, computed by the server — nothing is derived here. */
export function useMyReferralStatistics({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: myReferralStatisticsKey(),
    queryFn: getMyReferralStatistics,
    enabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 15,
    retry: referralRetry,
    refetchOnWindowFocus: false,
  });

  return { statisticsQuery: query, statistics: query.data?.data ?? null };
}

export function useMyReferredUsers({ filters, enabled = true }) {
  const query = useQuery({
    queryKey: myReferredUsersKey(filters),
    queryFn: () => getMyReferredUsers(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    retry: referralRetry,
    refetchOnWindowFocus: false,
  });

  return { usersQuery: query, result: query.data?.data ?? null };
}

export function useResolveReferral({ code, enabled = true } = {}) {
  const trimmed = String(code ?? "").trim();

  const query = useQuery({
    queryKey: resolveReferralKey(trimmed),
    queryFn: () => resolveReferralCode(trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: referralRetry,
    refetchOnWindowFocus: false,
  });

  return { resolutionQuery: query, resolution: query.data?.data ?? null };
}
