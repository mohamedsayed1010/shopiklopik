import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getPreferences } from "../../api/notifications/getPreferences";
import { updatePreferences } from "../../api/notifications/updatePreferences";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

export const NOTIFICATION_PREFERENCES_QUERY_KEY = ["notification-preferences"];

export default function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: getPreferences,
    staleTime: 1000 * 60,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: updatePreferences,

    onMutate: async ({ newListingsEnabled }) => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
      });

      const previous = queryClient.getQueryData(
        NOTIFICATION_PREFERENCES_QUERY_KEY
      );

      queryClient.setQueryData(
        NOTIFICATION_PREFERENCES_QUERY_KEY,
        (response) =>
          response?.data
            ? { ...response, data: { ...response.data, newListingsEnabled } }
            : response
      );

      return { previous };
    },

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم حفظ الإعدادات"));
    },

    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          NOTIFICATION_PREFERENCES_QUERY_KEY,
          context.previous
        );
      }

      toast.error(apiError(error, "تعذّر حفظ الإعدادات"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
      });
    },
  });

  return {
    preferencesQuery,
    updatePreferencesMutation,
    // `data` is the preferences object itself, so the caller does not have to
    // unwrap the envelope at every call site.
    newListingsEnabled: Boolean(
      preferencesQuery.data?.data?.newListingsEnabled
    ),
  };
}
