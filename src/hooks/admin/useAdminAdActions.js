import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  approveAdminAd,
  deleteAdminAd,
  rejectAdminAd,
  republishAdminAd,
  suspendAdminAd,
} from "../../api/admin/ads/adminAdsEndpoints";
import {
  ADMIN_ADS_ROOT,
  adminAdDetailsKey,
  adminPendingCountKey,
} from "./adminAdsKeys";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

const REPUBLISH_STATUS_TEXT = {
  401: "انتهت جلستك. سجّل الدخول مرة أخرى ثم أعد المحاولة.",
  403: "لا تملك صلاحية إعادة نشر الإعلانات.",
  404: "لم يعد هذا الإعلان موجودًا.",
  429: "طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم أعد المحاولة.",
};

/** The validation family: the server says why this ad is not eligible. */
const REPUBLISH_EXPLAINED = new Set([400, 409, 422]);

/* A validation answer is the server explaining why this ad cannot be
   republished, so its own words are shown. Everything else gets fixed text: a
   5xx body may carry internals, and the other statuses always mean one thing. */
function republishError(error) {
  const status = error?.response?.status;

  const fallback = "تعذّرت إعادة نشر الإعلان. حاول مرة أخرى لاحقًا.";

  if (REPUBLISH_EXPLAINED.has(status)) return apiError(error, fallback);

  return REPUBLISH_STATUS_TEXT[status] ?? fallback;
}

export default function useAdminAdActions({ onActionSuccess } = {}) {
  const queryClient = useQueryClient();

  const refresh = useCallback(
    (variables) => {
      // Everything under the admin-ads root: lists, stat cards, pending count.
      queryClient.invalidateQueries({ queryKey: ADMIN_ADS_ROOT });

      queryClient.invalidateQueries({ queryKey: adminPendingCountKey() });

      if (variables?.type != null && variables?.id) {
        queryClient.invalidateQueries({
          queryKey: adminAdDetailsKey(variables.type, variables.id),
        });
      }
    },
    [queryClient]
  );

  const handlers = useCallback(
    (successMessage, failureMessage) => ({
      onSuccess: (response, variables) => {
        toast.success(apiMessage(response, successMessage));

        onActionSuccess?.(variables);
      },
      onError: (error) => {
        toast.error(apiError(error, failureMessage));
      },
      onSettled: (_data, _error, variables) => refresh(variables),
    }),
    [refresh, onActionSuccess]
  );

  const approveMutation = useMutation({
    mutationFn: approveAdminAd,
    ...handlers("تمت الموافقة على الإعلان", "تعذّرت الموافقة على الإعلان"),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectAdminAd,
    ...handlers("تم رفض الإعلان", "تعذّر رفض الإعلان"),
  });

  const suspendMutation = useMutation({
    mutationFn: suspendAdminAd,
    ...handlers("تم إيقاف الإعلان", "تعذّر إيقاف الإعلان"),
  });

  const republishMutation = useMutation({
    mutationFn: republishAdminAd,

    onSuccess: (response, variables) => {
      toast.success(apiMessage(response, "تمت إعادة نشر الإعلان"));

      onActionSuccess?.(variables);
    },

    onError: (error) => {
      toast.error(republishError(error));
    },

    // The lists, the stat cards and the details all re-read the new dates.
    onSettled: (_data, _error, variables) => refresh(variables),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminAd,

    onSuccess: (response, variables) => {
      toast.success(apiMessage(response, "تم حذف الإعلان"));

      /* A deleted ad has no details to go back to, so its cache entry is
         dropped rather than invalidated — invalidating would re-request a 404
         the moment anything still referenced it. */
      if (variables?.type != null && variables?.id) {
        queryClient.removeQueries({
          queryKey: adminAdDetailsKey(variables.type, variables.id),
        });
      }

      onActionSuccess?.(variables);
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر حذف الإعلان"));
    },

    onSettled: (_data, _error, variables) => refresh(variables),
  });

  return useMemo(
    () => ({
      approveMutation,
      rejectMutation,
      suspendMutation,
      republishMutation,
      deleteMutation,
      isPending:
        approveMutation.isPending ||
        rejectMutation.isPending ||
        suspendMutation.isPending ||
        republishMutation.isPending ||
        deleteMutation.isPending,
    }),
    [
      approveMutation,
      rejectMutation,
      suspendMutation,
      republishMutation,
      deleteMutation,
    ]
  );
}
