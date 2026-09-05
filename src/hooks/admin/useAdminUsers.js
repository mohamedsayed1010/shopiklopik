import { useCallback, useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getAdminUserDetails,
  getAdminUserStatuses,
  getAdminUsers,
  updateAdminUserStatus,
} from "../../api/admin/users/adminUsersEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

export const ADMIN_USERS_ROOT = ["admin-users"];

export const adminUsersListKey = (filters) => [
  ...ADMIN_USERS_ROOT,
  "list",
  filters,
];

export const adminUserDetailsKey = (id) => [
  ...ADMIN_USERS_ROOT,
  "details",
  String(id ?? ""),
];

export const adminUserStatusesKey = () => [...ADMIN_USERS_ROOT, "statuses"];

/** One page of users. Holds the current rows while the next page loads. */
export function useAdminUsers({ filters, enabled = true }) {
  return useQuery({
    queryKey: adminUsersListKey(filters),
    queryFn: () => getAdminUsers(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminUserDetails({ id }) {
  return useQuery({
    queryKey: adminUserDetailsKey(id),
    queryFn: () => getAdminUserDetails(id),
    enabled: Boolean(id),
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminUserStatuses({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminUserStatusesKey(),
    queryFn: getAdminUserStatuses,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
  });

  /* The envelope is a bare list here, not a paginated result. */
  const statuses = useMemo(() => query.data?.data ?? [], [query.data]);

  return { statusesQuery: query, statuses };
}

export function useUpdateUserStatus({ onDone } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateAdminUserStatus,

    onSuccess: (response, variables) => {
      toast.success(apiMessage(response, "تم تحديث حالة الحساب"));

      if (response?.data) {
        queryClient.setQueryData(adminUserDetailsKey(variables.id), response);
      }

      onDone?.(variables);
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر تحديث حالة الحساب"));
    },

    // The row's badge and any status-filtered page both change; re-read both.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_ROOT }),
  });

  const submit = useCallback(
    (variables, options) => mutation.mutate(variables, options),
    [mutation]
  );

  return { updateStatusMutation: mutation, submit };
}
