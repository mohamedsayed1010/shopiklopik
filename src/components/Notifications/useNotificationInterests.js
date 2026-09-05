import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getInterests } from "../../api/notifications/getInterests";
import { getInterestOptions } from "../../api/notifications/getInterestOptions";
import { addInterest } from "../../api/notifications/addInterest";
import { saveInterests } from "../../api/notifications/saveInterests";
import { setInterestEnabled } from "../../api/notifications/setInterestEnabled";
import { deleteInterest } from "../../api/notifications/deleteInterest";
import { NOTIFICATION_PREFERENCES_QUERY_KEY } from "./useNotificationPreferences";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

export const NOTIFICATION_INTERESTS_QUERY_KEY = ["notification-interests"];

export const NOTIFICATION_INTEREST_OPTIONS_QUERY_KEY = [
  "notification-interest-options",
];

/** Stable identity for a row in the picker, used to scope its busy state. */
export function interestKey(categoryId, subCategoryId) {
  // Explicitly nullish, not falsy: a subcategory id is an integer, and `0`
  // would otherwise be keyed as the whole category.
  return subCategoryId == null
    ? `cat-${categoryId}`
    : `sub-${categoryId}-${subCategoryId}`;
}

export default function useNotificationInterests() {
  const queryClient = useQueryClient();

  const [pendingKeys, setPendingKeys] = useState(() => new Set());

  const markPending = useCallback((key, isBusy) => {
    if (!key) return;

    setPendingKeys((previous) => {
      const next = new Set(previous);

      if (isBusy) next.add(key);
      else next.delete(key);

      return next;
    });
  }, []);

  const optionsQuery = useQuery({
    queryKey: NOTIFICATION_INTEREST_OPTIONS_QUERY_KEY,
    queryFn: getInterestOptions,
    staleTime: 1000 * 60,
  });

  const interestsQuery = useQuery({
    queryKey: NOTIFICATION_INTERESTS_QUERY_KEY,
    queryFn: getInterests,
    staleTime: 1000 * 60,
  });

  /* Every write changes both views of the same data — the annotated tree and
     the flat list — so both are re-read rather than patched by hand. */
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: NOTIFICATION_INTEREST_OPTIONS_QUERY_KEY,
    });

    queryClient.invalidateQueries({
      queryKey: NOTIFICATION_INTERESTS_QUERY_KEY,
    });
  }, [queryClient]);

  const addInterestMutation = useMutation({
    mutationFn: ({ categoryId, subCategoryId }) =>
      addInterest({ categoryId, subCategoryId }),

    onMutate: (variables) => markPending(variables?.key, true),

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تمت إضافة الاهتمام"));
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر إضافة الاهتمام"));
    },

    onSettled: (_data, _error, variables) => {
      markPending(variables?.key, false);

      refresh();
    },
  });

  const deleteInterestMutation = useMutation({
    mutationFn: ({ id }) => deleteInterest(id),

    onMutate: (variables) => markPending(variables?.key, true),

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم إلغاء متابعة القسم"));
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر إلغاء المتابعة"));
    },

    onSettled: (_data, _error, variables) => {
      markPending(variables?.key, false);

      refresh();
    },
  });

  const setInterestEnabledMutation = useMutation({
    mutationFn: ({ id, isEnabled }) => setInterestEnabled({ id, isEnabled }),

    onMutate: (variables) => markPending(variables?.key, true),

    onSuccess: (response, variables) => {
      toast.success(
        apiMessage(
          response,
          variables.isEnabled ? "تم تفعيل التنبيه" : "تم كتم التنبيه"
        )
      );
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر تحديث التنبيه"));
    },

    onSettled: (_data, _error, variables) => {
      markPending(variables?.key, false);

      refresh();
    },
  });

  const saveInterestsMutation = useMutation({
    mutationFn: saveInterests,

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم حفظ الاهتمامات"));
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر حفظ الاهتمامات"));
    },

    onSettled: () => {
      refresh();

      /* The replacement body carries `newListingsEnabled`, so the preference
         card is re-read rather than left showing a stale switch. */
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
      });
    },
  });

  const categories = useMemo(
    () => optionsQuery.data?.data?.categories ?? [],
    [optionsQuery.data]
  );

  const interests = useMemo(
    () => interestsQuery.data?.data?.interests ?? [],
    [interestsQuery.data]
  );

  /** Follow a row, or unfollow it when it is already followed. */
  const toggleInterest = useCallback(
    ({ categoryId, subCategoryId = null, interestId, isSelected }) => {
      const key = interestKey(categoryId, subCategoryId);

      if (pendingKeys.has(key)) return;

      if (isSelected && interestId) {
        deleteInterestMutation.mutate({ id: interestId, key });

        return;
      }

      addInterestMutation.mutate({ categoryId, subCategoryId, key });
    },
    [addInterestMutation, deleteInterestMutation, pendingKeys]
  );

  return {
    optionsQuery,
    interestsQuery,
    categories,
    interests,
    toggleInterest,
    setInterestEnabledMutation,
    saveInterestsMutation,
    pendingKeys,
  };
}
