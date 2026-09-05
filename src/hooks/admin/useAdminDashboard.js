import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAdminAnalytics,
  getAdminDashboard,
} from "../../api/admin/dashboard/adminDashboardEndpoints";
import { adminRetry } from "./useAdminAuditLogs";

export const ADMIN_DASHBOARD_ROOT = ["admin-dashboard"];

export const adminDashboardKey = (latest) => [
  ...ADMIN_DASHBOARD_ROOT,
  "overview",
  latest,
];

export const adminAnalyticsKey = (range) => [
  ...ADMIN_DASHBOARD_ROOT,
  "analytics",
  range,
];

export function useAdminDashboard({ latest = 5 } = {}) {
  return useQuery({
    queryKey: adminDashboardKey(latest),
    queryFn: () => getAdminDashboard({ latest }),
    // A moderation queue read at the top of the hour should not be an hour old.
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminAnalytics({ from, to }) {
  return useQuery({
    queryKey: adminAnalyticsKey({ from, to }),
    queryFn: () => getAdminAnalytics({ from, to }),
    // Placeholder rather than a skeleton: the charts hold their previous shape
    // while a new range loads, so switching preset does not collapse the page.
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: adminRetry,
  });
}

export function useRefreshAdminDashboard() {
  const queryClient = useQueryClient();

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_ROOT }),
    [queryClient]
  );
}
