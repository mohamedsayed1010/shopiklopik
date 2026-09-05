import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { updateProfile } from "../../../api/profile/updateProfile";
import {
  PROFILE_QUERY_KEY,
  apiMessage,
  mergeProfileCache,
  mergeStoredUser,
} from "../profileCache";

export default function useUpdateProfile() {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم تحديث بياناتك بنجاح"));

      // Paint the new values immediately, then reconcile with the server —
      // `PUT` answers with a UserDto, so it cannot refresh the statistics.
      mergeProfileCache(queryClient, response?.data);
      mergeStoredUser(response?.data);

      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },

    /* No toast — `EditProfileModal` reports this on the fields the server
       named, and in a toast only for what it could not attribute. */
  });

  return {
    updateProfileMutation,
  };
}
