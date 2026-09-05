import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createPayment,
  getMyPayments,
  getPaymentDetails,
  getPaymentMethods,
} from "../api/payments/payments";
import { apiError, apiMessage } from "../pages/Profile/profileCache";

export const PAYMENT_METHODS_KEY = ["payment-methods"];

export const MY_PAYMENTS_ROOT = ["my-payments"];

export const MY_PAYMENTS_LIST_ROOT = [...MY_PAYMENTS_ROOT, "list"];

export const myPaymentsKey = (status) => [
  ...MY_PAYMENTS_LIST_ROOT,
  status ?? "all",
];

export const paymentDetailsKey = (id) => [
  ...MY_PAYMENTS_ROOT,
  "details",
  String(id ?? ""),
];

/** Answers the server gives once and will keep giving; retrying them is noise. */
function paymentRetry(failureCount, error) {
  const status = error?.response?.status;

  if (status === 401 || status === 403 || status === 404) return false;

  if (status === 429) return failureCount < 1;

  return failureCount < 2;
}

export function usePaymentMethods({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: PAYMENT_METHODS_KEY,
    queryFn: getPaymentMethods,
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: paymentRetry,
  });

  return { methodsQuery: query, methods: query.data?.data ?? [] };
}

export function useMyPayments({ status } = {}) {
  const query = useQuery({
    queryKey: myPaymentsKey(status),
    queryFn: () => getMyPayments({ status }),
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: paymentRetry,
  });

  return { paymentsQuery: query, payments: query.data?.data ?? [] };
}

export function usePaymentDetails({ id }) {
  return useQuery({
    queryKey: paymentDetailsKey(id),
    queryFn: () => getPaymentDetails(id),
    enabled: Boolean(id),
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 5,
    retry: paymentRetry,
  });
}

export function useCreatePayment({ onDone } = {}) {
  const queryClient = useQueryClient();

  const [progress, setProgress] = useState(null);

  const mutation = useMutation({
    mutationFn: (values) =>
      createPayment(values, (event) => {
        if (!event?.total) return;

        setProgress(Math.round((event.loaded * 100) / event.total));
      }),

    onMutate: () => setProgress(0),

    onSuccess: (response) => {
      const created = response?.data;

      if (created?.id) {
        queryClient.setQueryData(paymentDetailsKey(created.id), response);
      }

      toast.success(apiMessage(response, "تم إرسال الدفعة للمراجعة"));

      onDone?.(created);
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر إرسال الدفعة"));
    },

    onSettled: () => {
      setProgress(null);

      /* Every status filter is now potentially stale, so the whole list subtree
         goes — but not the details beneath the root, one of which was just
         seeded from this very response. */
      queryClient.invalidateQueries({ queryKey: MY_PAYMENTS_LIST_ROOT });
    },
  });

  const submit = useCallback(
    (values, options) => mutation.mutate(values, options),
    [mutation]
  );

  return { createMutation: mutation, submit, progress };
}

export function useMyPaymentStatusOptions(payments) {
  return useMemo(() => {
    const seen = new Map();

    for (const payment of payments ?? []) {
      if (payment?.status == null || seen.has(payment.status)) continue;

      seen.set(payment.status, {
        id: payment.status,
        name: payment.statusName || `#${payment.status}`,
      });
    }

    return [...seen.values()].sort((a, b) => a.id - b.id);
  }, [payments]);
}
