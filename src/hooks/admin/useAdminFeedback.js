import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  deleteAdminFeedback,
  getAdminFeedback,
  getAdminFeedbackDetails,
} from "../../api/admin/feedback/adminFeedbackEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

export const ADMIN_FEEDBACK_ROOT = ["admin-feedback"];

export const adminFeedbackListKey = (filters) => [
  ...ADMIN_FEEDBACK_ROOT,
  "list",
  filters,
];

export const adminFeedbackDetailsKey = (id) => [
  ...ADMIN_FEEDBACK_ROOT,
  "details",
  String(id ?? ""),
];

/** One page of ratings. Holds the current rows while the next page loads. */
export function useAdminFeedback({ filters, enabled = true }) {
  return useQuery({
    queryKey: adminFeedbackListKey(filters),
    queryFn: () => getAdminFeedback(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminFeedbackDetails({ id, seed, enabled = true }) {
  return useQuery({
    queryKey: adminFeedbackDetailsKey(id),
    queryFn: () => getAdminFeedbackDetails(id),
    enabled: enabled && Boolean(id),
    initialData: seed ? { success: true, message: null, data: seed } : undefined,
    initialDataUpdatedAt: 0,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useDeleteAdminFeedback({ onDone } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteAdminFeedback,

    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: adminFeedbackDetailsKey(id) });

      toast.success(apiMessage(response, "تم حذف التقييم"));

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر حذف التقييم")),

    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_FEEDBACK_ROOT }),
  });

  return { mutation, submit: mutation.mutate };
}
