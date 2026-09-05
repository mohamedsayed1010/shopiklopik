import { useCallback, useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  actOnAdminReport,
  getAdminReports,
  getAdminReportsMetadata,
  ignoreAdminReport,
  updateAdminReport,
} from "../../api/admin/reports/adminReportsEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

export const ADMIN_REPORTS_ROOT = ["admin-reports"];

export const adminReportsListKey = (filters) => [
  ...ADMIN_REPORTS_ROOT,
  "list",
  filters,
];

export const adminReportsMetadataKey = () => [...ADMIN_REPORTS_ROOT, "metadata"];

export function useAdminReports({ filters, enabled = true }) {
  return useQuery({
    queryKey: adminReportsListKey(filters),
    queryFn: () => getAdminReports(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminReportsMetadata({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminReportsMetadataKey(),
    queryFn: getAdminReportsMetadata,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
  });

  const reasons = useMemo(() => query.data?.data?.reasons ?? [], [query.data]);

  const statuses = useMemo(() => query.data?.data?.statuses ?? [], [query.data]);

  return { metadataQuery: query, reasons, statuses };
}

export function useAdminReportActions({ onActionSuccess } = {}) {
  const queryClient = useQueryClient();

  const settle = useCallback(
    (response, variables) => {
      /* A decision can also change the reported listing — suspending or
         deleting it — so the ads surface is re-read too rather than left
         showing a listing this page just removed. */
      queryClient.invalidateQueries({ queryKey: ADMIN_REPORTS_ROOT });

      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });

      // The updated report travels to the caller instead of into a cache.
      onActionSuccess?.(response?.data ?? null, variables);
    },
    [queryClient, onActionSuccess]
  );

  const ignoreMutation = useMutation({
    mutationFn: ignoreAdminReport,
    onSuccess: (response, variables) => {
      toast.success(apiMessage(response, "تم تجاهل البلاغ"));

      settle(response, variables);
    },
    onError: (error) => toast.error(apiError(error, "تعذّر تجاهل البلاغ")),
  });

  const actionMutation = useMutation({
    mutationFn: actOnAdminReport,
    onSuccess: (response, variables) => {
      // The server's wording says which of the three effects it applied.
      toast.success(apiMessage(response, "تم اتخاذ الإجراء"));

      settle(response, variables);
    },
    onError: (error) => toast.error(apiError(error, "تعذّر اتخاذ الإجراء")),
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminReport,
    onSuccess: (response, variables) => {
      toast.success(apiMessage(response, "تم تحديث البلاغ"));

      settle(response, variables);
    },
    onError: (error) => toast.error(apiError(error, "تعذّر تحديث البلاغ")),
  });

  return useMemo(
    () => ({
      ignoreMutation,
      actionMutation,
      updateMutation,
      isPending:
        ignoreMutation.isPending ||
        actionMutation.isPending ||
        updateMutation.isPending,
    }),
    [ignoreMutation, actionMutation, updateMutation]
  );
}
