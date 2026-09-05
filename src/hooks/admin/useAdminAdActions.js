import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  approveAdminAd,
  deleteAdminAd,
  rejectAdminAd,
  suspendAdminAd,
} from "../../api/admin/ads/adminAdsEndpoints";
import {
  ADMIN_ADS_ROOT,
  adminAdDetailsKey,
  adminPendingCountKey,
} from "./adminAdsKeys";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

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
      deleteMutation,
      isPending:
        approveMutation.isPending ||
        rejectMutation.isPending ||
        suspendMutation.isPending ||
        deleteMutation.isPending,
    }),
    [approveMutation, rejectMutation, suspendMutation, deleteMutation]
  );
}
