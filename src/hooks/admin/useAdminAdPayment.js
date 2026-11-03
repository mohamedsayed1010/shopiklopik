import { useEffect, useRef } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getAdPaymentHistory,
  getAdPaymentSettings,
  getAdPaymentSubmissionById,
  getAdPaymentSubmissionScreenshot,
  getAdPaymentSubmissions,
  reviewAdPaymentSubmission,
  updateAdPaymentSettings,
} from "../../api/admin/adPayment/adminAdPaymentEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiMessage } from "../../pages/Profile/profileCache";
import {
  adPaymentErrorText,
  parseReviewResult,
  toAdPaymentListParams,
} from "../../utils/adPayment";

export const ADMIN_AD_PAYMENT_ROOT = ["admin-ad-payment"];

export const adPaymentSettingsKey = () => [...ADMIN_AD_PAYMENT_ROOT, "settings"];

export const adPaymentSubmissionsRoot = () => [...ADMIN_AD_PAYMENT_ROOT, "submissions"];

/* The key holds the exact query the request sends, so every filter and the
   page are in it, and two spellings of one query share a cache entry. */
export const adPaymentSubmissionsKey = (filters) => [
  ...adPaymentSubmissionsRoot(),
  toAdPaymentListParams(filters),
];

export const adPaymentHistoryRoot = () => [...ADMIN_AD_PAYMENT_ROOT, "history"];

export const adPaymentHistoryKey = (filters) => [
  ...adPaymentHistoryRoot(),
  toAdPaymentListParams(filters),
];

export const adPaymentSubmissionKey = (id) => [
  ...ADMIN_AD_PAYMENT_ROOT,
  "submission",
  String(id ?? ""),
];

export const adPaymentScreenshotKey = (id) => [
  ...ADMIN_AD_PAYMENT_ROOT,
  "screenshot",
  String(id ?? ""),
];

export function useAdPaymentSettings({ enabled = true } = {}) {
  return useQuery({
    queryKey: adPaymentSettingsKey(),
    queryFn: getAdPaymentSettings,
    enabled,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    retry: adminRetry,
  });
}

export function useAdPaymentSubmissions({ filters, enabled = true }) {
  return useQuery({
    queryKey: adPaymentSubmissionsKey(filters),
    queryFn: () => getAdPaymentSubmissions(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdPaymentHistory({ filters, enabled = true }) {
  return useQuery({
    queryKey: adPaymentHistoryKey(filters),
    queryFn: () => getAdPaymentHistory(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdPaymentSubmission({ id, enabled = true }) {
  return useQuery({
    queryKey: adPaymentSubmissionKey(id),
    queryFn: () => getAdPaymentSubmissionById(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

/* The screenshot as a Blob. Not kept after it closes (gcTime 0): it is a
   private document, and the object URL made from it is revoked on unmount. */
export function useAdPaymentScreenshot({ id, enabled = true }) {
  return useQuery({
    queryKey: adPaymentScreenshotKey(id),
    queryFn: () => getAdPaymentSubmissionScreenshot(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60,
    gcTime: 0,
    /* A 200 that is not an image will not become one on a retry. */
    retry: (failureCount, error) => (error?.notAnImage ? false : adminRetry(failureCount, error)),
    refetchOnWindowFocus: false,
  });
}

/* A temporary URL for a Blob, written straight onto an element (`src` of an
   <img>, `href` of an <a>) and revoked when the Blob changes or the element
   unmounts. No React state holds it, so StrictMode's mount → cleanup → mount
   gets a fresh URL each time and never shows a revoked one. */
export function useObjectUrlRef(blob, attribute = "src") {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;

    if (!element || !blob || typeof URL === "undefined" || !URL.createObjectURL) {
      return undefined;
    }

    const url = URL.createObjectURL(blob);

    element.setAttribute(attribute, url);

    return () => {
      element.removeAttribute(attribute);

      URL.revokeObjectURL(url);
    };
  }, [blob, attribute]);

  return ref;
}

export function useUpdateAdPaymentSettings({ onDone } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdPaymentSettings,

    onSuccess: (response) => {
      /* The answer is the saved settings, so it is shown at once; the refetch
         confirms it. */
      if (response?.data && typeof response.data === "object") {
        queryClient.setQueryData(adPaymentSettingsKey(), response);
      }

      queryClient.invalidateQueries({ queryKey: adPaymentSettingsKey() });

      toast.success(apiMessage(response, "تم حفظ إعدادات الدفع."));

      onDone?.(response);
    },

    onError: (error) => {
      toast.error(adPaymentErrorText(error, { subject: "إعدادات الدفع" }));
    },
  });
}

export function useReviewAdPaymentSubmission({ onDone } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewAdPaymentSubmission,

    onSuccess: (response, variables) => {
      const result = parseReviewResult(response);

      const id = variables?.paymentSubmissionId;

      /* Nothing is marked approved or rejected before this point: the record
         shown is the one the server returned. */
      if (result?.payment) {
        queryClient.setQueryData(adPaymentSubmissionKey(id), {
          success: true,
          message: response?.message,
          data: result.payment,
          errors: null,
        });
      }

      toast.success(apiMessage(response, "تمت مراجعة طلب الدفع."));

      onDone?.(result, response);
    },

    onError: (error, variables) => {
      toast.error(adPaymentErrorText(error, { subject: "مراجعة المدفوعات" }));

      /* A conflict means the record moved on; show what it is now. */
      if (error?.response?.status === 409 || error?.response?.status === 404) {
        queryClient.invalidateQueries({
          queryKey: adPaymentSubmissionKey(variables?.paymentSubmissionId),
        });
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: adPaymentSubmissionsRoot() });

      queryClient.invalidateQueries({ queryKey: adPaymentHistoryRoot() });

      queryClient.invalidateQueries({
        queryKey: adPaymentSubmissionKey(variables?.paymentSubmissionId),
      });
    },
  });
}
