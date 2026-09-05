import { useCallback } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createAdminAccount,
  deleteAdminAccount,
  getAdminAccountDetails,
  getAdminAccounts,
  getAdminCandidate,
  getAdminCandidates,
  updateAdminAccountPermissions,
  updateAdminAccountStatus,
} from "../../api/admin/admins/adminAccountsEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";
import { ADMIN_PERMISSIONS_ROOT } from "./useAdminPermissions";

export const ADMIN_ACCOUNTS_ROOT = ["admin-accounts"];

export const adminAccountsListKey = (filters) => [
  ...ADMIN_ACCOUNTS_ROOT,
  "list",
  filters,
];

export const adminAccountKey = (id) => [
  ...ADMIN_ACCOUNTS_ROOT,
  "details",
  String(id ?? ""),
];

export const adminCandidatesKey = (params) => [
  ...ADMIN_ACCOUNTS_ROOT,
  "candidates",
  params,
];

export const adminCandidateKey = (userId) => [
  ...ADMIN_ACCOUNTS_ROOT,
  "candidate",
  String(userId ?? ""),
];

export function candidateItems(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}

/** One candidate, from either shape. */
export function candidateItem(payload) {
  if (!payload) return null;

  return payload.data ?? payload;
}

/** One page of admin accounts. Holds the current rows while the next loads. */
export function useAdminAccounts({ filters, enabled = true }) {
  return useQuery({
    queryKey: adminAccountsListKey(filters),
    queryFn: () => getAdminAccounts(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminAccountDetails({ id, enabled = true }) {
  return useQuery({
    queryKey: adminAccountKey(id),
    queryFn: () => getAdminAccountDetails(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminCandidates({ params, enabled = true }) {
  return useQuery({
    queryKey: adminCandidatesKey(params),
    queryFn: () => getAdminCandidates(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminCandidate({ userId, enabled = true }) {
  return useQuery({
    queryKey: adminCandidateKey(userId),
    queryFn: () => getAdminCandidate(userId),
    enabled: Boolean(userId) && enabled,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_ROOT });

    queryClient.invalidateQueries({ queryKey: ADMIN_PERMISSIONS_ROOT });
  }, [queryClient]);
}

export function useCreateAdminAccount({ onDone } = {}) {
  const invalidate = useInvalidateAccounts();

  const mutation = useMutation({
    mutationFn: createAdminAccount,

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم إنشاء حساب المسؤول"));

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر إنشاء حساب المسؤول")),

    onSettled: invalidate,
  });

  return { mutation, submit: mutation.mutate };
}

export function useUpdateAdminAccountPermissions({ onDone } = {}) {
  const queryClient = useQueryClient();

  const invalidate = useInvalidateAccounts();

  const mutation = useMutation({
    mutationFn: updateAdminAccountPermissions,

    onSuccess: (response, variables) => {
      if (response?.data) {
        queryClient.setQueryData(adminAccountKey(variables.id), response);
      }

      toast.success(apiMessage(response, "تم تحديث صلاحيات المسؤول"));

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر تحديث الصلاحيات")),

    onSettled: invalidate,
  });

  return { mutation, submit: mutation.mutate };
}

export function useUpdateAdminAccountStatus({ onDone } = {}) {
  const queryClient = useQueryClient();

  const invalidate = useInvalidateAccounts();

  const mutation = useMutation({
    mutationFn: updateAdminAccountStatus,

    onSuccess: (response, variables) => {
      if (response?.data) {
        queryClient.setQueryData(adminAccountKey(variables.id), response);
      }

      toast.success(
        apiMessage(
          response,
          variables.isActive ? "تم تفعيل الحساب" : "تم تعطيل الحساب"
        )
      );

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر تغيير حالة الحساب")),

    onSettled: invalidate,
  });

  return { mutation, submit: mutation.mutate };
}

export function useDeleteAdminAccount({ onDone } = {}) {
  const queryClient = useQueryClient();

  const invalidate = useInvalidateAccounts();

  const mutation = useMutation({
    mutationFn: deleteAdminAccount,

    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: adminAccountKey(id) });

      toast.success(apiMessage(response, "تم حذف حساب المسؤول"));

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر حذف حساب المسؤول")),

    onSettled: invalidate,
  });

  return { mutation, submit: mutation.mutate };
}
