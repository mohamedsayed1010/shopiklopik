import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAdPaymentConfig, getAdPaymentStatus, submitAdPayment } from "../api/adPayment/adPayment";

/* Query keys for the user-side ad payment flow. The admin side has its own
   keys in hooks/admin/useAdminAdPayment.js; the two never share a cache. */
export const adPaymentKeys = {
  root: ["ad-payment"],
  config: (endpoint) => ["ad-payment", "config", endpoint ?? ""],
  statusRoot: ["ad-payment", "status"],
  status: (advertisementType, advertisementId) => [
    "ad-payment",
    "status",
    String(advertisementType ?? ""),
    String(advertisementId ?? ""),
  ],
};

function retryRule(failureCount, error) {
  const status = error?.response?.status;

  if (status === 400 || status === 401 || status === 403 || status === 404) return false;

  if (status === 429) return failureCount < 1;

  return failureCount < 2;
}

/* The live ad payment settings. The backend asks for a fresh read every time a
   form opens (Cache-Control: no-store), so nothing is reused: no stale time,
   refetched when the form mounts and when the window regains focus, so an admin
   switching payments on or off is picked up without a reload. */
export function useAdPaymentConfig({ configEndpoint, enabled = true } = {}) {
  return useQuery({
    queryKey: adPaymentKeys.config(configEndpoint),
    queryFn: () => getAdPaymentConfig(configEndpoint),
    select: (response) => response?.data ?? null,
    enabled: Boolean(enabled && configEndpoint),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: retryRule,
  });
}

/** The authoritative payment state of one advertisement (owner only). */
export function useAdPaymentStatus({ statusEndpoint, advertisementType, advertisementId, enabled = true } = {}) {
  return useQuery({
    queryKey: adPaymentKeys.status(advertisementType, advertisementId),
    queryFn: () => getAdPaymentStatus({ statusEndpoint, advertisementType, advertisementId }),
    select: (response) => response?.data ?? null,
    enabled: Boolean(enabled && statusEndpoint && advertisementType && advertisementId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: retryRule,
  });
}

/* Submit or resubmit a payment proof. A ref lock refuses a second request while
   one is in flight (double clicks, Enter twice); the server's 409 covers the
   rest. The status of that advertisement is refreshed afterwards either way. */
export function useSubmitAdPayment() {
  const queryClient = useQueryClient();

  const inFlight = useRef(false);

  const [progress, setProgress] = useState(null);

  const mutation = useMutation({
    mutationFn: async ({ target, formData }) => {
      if (inFlight.current) throw Object.assign(new Error("A payment submission is already running"), { duplicate: true });

      inFlight.current = true;

      try {
        return await submitAdPayment(target, formData, (event) => {
          if (event?.total) setProgress(Math.round((event.loaded * 100) / event.total));
        });
      } finally {
        inFlight.current = false;
      }
    },

    retry: false,

    onMutate: () => setProgress(0),

    onSettled: (_data, _error, variables) => {
      setProgress(null);

      if (variables?.advertisementType && variables?.advertisementId) {
        queryClient.invalidateQueries({
          queryKey: adPaymentKeys.status(variables.advertisementType, variables.advertisementId),
        });
      }
    },
  });

  const submit = useCallback((variables, options) => mutation.mutateAsync(variables, options), [mutation]);

  return { mutation, submit, progress, isSubmitting: mutation.isPending };
}
