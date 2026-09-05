import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createAdminPaymentMethod,
  deleteAdminPaymentMethod,
  getAdminPaymentMethod,
  getAdminPaymentMethodTypes,
  getAdminPaymentMethods,
  updateAdminPaymentMethod,
  updateAdminPaymentMethodStatus,
} from "../../api/admin/paymentMethods/adminPaymentMethodsEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";
import { PAYMENT_METHODS_KEY } from "../usePayments";

export const ADMIN_PAYMENT_METHODS_ROOT = ["admin-payment-methods"];

export const adminPaymentMethodsKey = () => [
  ...ADMIN_PAYMENT_METHODS_ROOT,
  "list",
];

export const adminPaymentMethodKey = (id) => [
  ...ADMIN_PAYMENT_METHODS_ROOT,
  "details",
  String(id ?? ""),
];

export const adminPaymentMethodTypesKey = () => [
  ...ADMIN_PAYMENT_METHODS_ROOT,
  "types",
];

export function useAdminPaymentMethods({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminPaymentMethodsKey(),
    queryFn: getAdminPaymentMethods,
    enabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    retry: adminRetry,
  });

  return { methodsQuery: query, methods: query.data?.data ?? [] };
}

export function useAdminPaymentMethod({ id, seed, enabled = true }) {
  return useQuery({
    queryKey: adminPaymentMethodKey(id),
    queryFn: () => getAdminPaymentMethod(id),
    enabled: Boolean(id) && enabled,
    placeholderData: seed ? { success: true, data: seed } : undefined,
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminPaymentMethodTypes({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminPaymentMethodTypesKey(),
    queryFn: getAdminPaymentMethodTypes,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
  });

  return { typesQuery: query, types: query.data?.data ?? [] };
}

function useInvalidateMethods() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: adminPaymentMethodsKey() });

    queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
  }, [queryClient]);
}

export function useCreatePaymentMethod({ onDone } = {}) {
  const invalidate = useInvalidateMethods();

  const mutation = useMutation({
    mutationFn: createAdminPaymentMethod,

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تمت إضافة طريقة الدفع"));

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّرت إضافة طريقة الدفع")),

    onSettled: invalidate,
  });

  return { mutation, submit: mutation.mutate };
}

export function useUpdatePaymentMethod({ onDone } = {}) {
  const queryClient = useQueryClient();

  const invalidate = useInvalidateMethods();

  const mutation = useMutation({
    mutationFn: updateAdminPaymentMethod,

    onSuccess: (response, variables) => {
      // The PUT answers with the updated row; adopt it rather than re-reading.
      if (response?.data) {
        queryClient.setQueryData(adminPaymentMethodKey(variables.id), response);
      }

      toast.success(apiMessage(response, "تم تحديث طريقة الدفع"));

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر تحديث طريقة الدفع")),

    onSettled: invalidate,
  });

  return { mutation, submit: mutation.mutate };
}

export function useDeletePaymentMethod({ onDone } = {}) {
  const queryClient = useQueryClient();

  const invalidate = useInvalidateMethods();

  const mutation = useMutation({
    mutationFn: deleteAdminPaymentMethod,

    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: adminPaymentMethodKey(id) });

      toast.success(apiMessage(response, "تم حذف طريقة الدفع"));

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر حذف طريقة الدفع")),

    onSettled: invalidate,
  });

  return { mutation, submit: mutation.mutate };
}

export function useTogglePaymentMethodStatus() {
  const queryClient = useQueryClient();

  const invalidate = useInvalidateMethods();

  const mutation = useMutation({
    mutationFn: updateAdminPaymentMethodStatus,

    onSuccess: (response, variables) => {
      if (response?.data) {
        queryClient.setQueryData(adminPaymentMethodKey(variables.id), response);
      }

      toast.success(
        apiMessage(
          response,
          variables.isActive ? "تم تفعيل طريقة الدفع" : "تم تعطيل طريقة الدفع"
        )
      );
    },

    onError: (error) => toast.error(apiError(error, "تعذّر تغيير حالة التفعيل")),

    onSettled: invalidate,
  });

  return {
    mutation,
    submit: mutation.mutate,
    pendingId: mutation.isPending ? mutation.variables?.id : null,
  };
}
