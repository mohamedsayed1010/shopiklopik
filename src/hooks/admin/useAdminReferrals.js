import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getAdminReferralDetails,
  getAdminReferralStatistics,
  getAdminReferralStatuses,
  getAdminReferrers,
  getAdminReferrals,
  getAdminUserReferrals,
} from "../../api/admin/referrals/adminReferralsEndpoints";
import { adminRetry } from "./useAdminAuditLogs";

export const ADMIN_REFERRALS_ROOT = ["admin-referrals"];

export const adminReferralsListKey = (filters) => [
  ...ADMIN_REFERRALS_ROOT,
  "list",
  filters,
];

export const adminReferralStatisticsKey = (top) => [
  ...ADMIN_REFERRALS_ROOT,
  "statistics",
  top,
];

export const adminReferrersKey = (filters) => [
  ...ADMIN_REFERRALS_ROOT,
  "referrers",
  filters,
];

export const adminReferralStatusesKey = () => [
  ...ADMIN_REFERRALS_ROOT,
  "statuses",
];

export const adminReferralDetailsKey = (id) => [
  ...ADMIN_REFERRALS_ROOT,
  "details",
  String(id ?? ""),
];

export const adminUserReferralsKey = (userId, filters) => [
  ...ADMIN_REFERRALS_ROOT,
  "user",
  String(userId ?? ""),
  filters,
];

/** One page of referrals. Holds the current rows while the next page loads. */
export function useAdminReferrals({ filters, enabled = true }) {
  return useQuery({
    queryKey: adminReferralsListKey(filters),
    queryFn: () => getAdminReferrals(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminReferralStatistics({ top = 5, enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminReferralStatisticsKey(top),
    queryFn: () => getAdminReferralStatistics({ top }),
    enabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    retry: adminRetry,
  });

  const statistics = query.data?.data ?? null;

  return {
    statisticsQuery: query,
    statistics,
    /* The server ranks them; the order it sent is the order shown. */
    topReferrers: statistics?.topReferrers ?? [],
  };
}

export function useAdminReferrers({ filters, enabled = true }) {
  return useQuery({
    queryKey: adminReferrersKey(filters),
    queryFn: () => getAdminReferrers(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminReferralStatuses({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminReferralStatusesKey(),
    queryFn: getAdminReferralStatuses,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
  });

  /* A bare list in the envelope, not a paginated result. */
  const statuses = useMemo(() => query.data?.data ?? [], [query.data]);

  return { statusesQuery: query, statuses };
}

/** One referral, by id. */
export function useAdminReferralDetails({ id, enabled = true }) {
  const query = useQuery({
    queryKey: adminReferralDetailsKey(id),
    queryFn: () => getAdminReferralDetails(id),
    enabled: enabled && Boolean(id),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });

  return { detailsQuery: query, referral: query.data?.data ?? null };
}

export function useAdminUserReferrals({ userId, filters, enabled = true }) {
  return useQuery({
    queryKey: adminUserReferralsKey(userId, filters),
    queryFn: () => getAdminUserReferrals({ userId, filters }),
    enabled: enabled && Boolean(userId),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}
