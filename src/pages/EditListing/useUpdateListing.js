import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  addListingImages,
  deleteListingImage,
  updateListing,
} from "../../api/profile/listingActions";
import {
  MY_LISTINGS_QUERY_KEY,
  PROFILE_QUERY_KEY,
  apiMessage,
} from "../Profile/profileCache";
import { adPaymentKeys } from "../../hooks/useAdPayment";
import {
  imageFailureText,
  saveListingWithSeparateImages,
} from "../../utils/listingImages";

/* `images` is present only for a module whose update cannot carry files (cars):
   `{ listingId, endpoints, newFiles, removedIds }` — see `utils/listingImages`. */
async function save({ endpoint, body, images }) {
  if (!images) {
    return { response: await updateListing(endpoint, body), failures: [] };
  }

  return saveListingWithSeparateImages({
    updateEndpoint: endpoint,
    body,
    listingId: images.listingId,
    endpoints: images.endpoints,
    newFiles: images.newFiles,
    removedIds: images.removedIds,
    api: {
      update: updateListing,
      addImages: addListingImages,
      removeImage: deleteListingImage,
    },
  });
}

export default function useUpdateListing({ onSuccess } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: save,

    onSuccess: ({ response, failures }, variables) => {
      toast.success(apiMessage(response, "تم حفظ تعديلات الإعلان"));

      /* The update went through but a photo step did not: said plainly, never
         folded into the success. */
      const imageProblem = imageFailureText(failures);

      if (imageProblem) toast.error(imageProblem, { duration: 8000 });

      queryClient.invalidateQueries({
        queryKey: ["dynamic-details", variables.endpoint],
      });

      queryClient.invalidateQueries({ queryKey: ["dynamic-list"] });

      queryClient.invalidateQueries({ queryKey: ["similar-advertisements"] });

      queryClient.invalidateQueries({ queryKey: MY_LISTINGS_QUERY_KEY });

      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

      /* An edit can send a listing back to review ("وهيتراجع تاني قبل ما
         يظهر"). The status shown on its details page and payment page is the
         server's, so it is re-read — never set here. */
      queryClient.invalidateQueries({ queryKey: adPaymentKeys.statusRoot });

      onSuccess?.(response);
    },

    /* No toast: the edit form maps the server findings onto its own fields
       and summarises the rest, exactly as publishing does. Saying it here too
       would show the same rejection twice. */
  });
}
