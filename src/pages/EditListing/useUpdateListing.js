import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { updateListing } from "../../api/profile/listingActions";
import {
  MY_LISTINGS_QUERY_KEY,
  PROFILE_QUERY_KEY,
  apiMessage,
} from "../Profile/profileCache";

export default function useUpdateListing({ onSuccess } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ endpoint, body }) => updateListing(endpoint, body),

    onSuccess: (response, variables) => {
      toast.success(apiMessage(response, "تم حفظ تعديلات الإعلان"));

      queryClient.invalidateQueries({
        queryKey: ["dynamic-details", variables.endpoint],
      });

      queryClient.invalidateQueries({ queryKey: ["dynamic-list"] });

      queryClient.invalidateQueries({ queryKey: ["similar-advertisements"] });

      queryClient.invalidateQueries({ queryKey: MY_LISTINGS_QUERY_KEY });

      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

      onSuccess?.(response);
    },

    /* No toast: the edit form maps the server findings onto its own fields
       and summarises the rest, exactly as publishing does. Saying it here too
       would show the same rejection twice. */
  });
}
