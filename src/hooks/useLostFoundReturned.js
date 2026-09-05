import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { markLostFoundReturned } from "../api/lostFound/interactions";
import { reportApiError } from "../utils/reportApiError";


/** `PostStatus`, as the API publishes it (enum [1, 2]) and as it behaves. */
export const POST_STATUS = { open: 1, returned: 2 };

export const isReturned = (post) =>
  Number(post?.status) === POST_STATUS.returned;

export default function useLostFoundReturned({ postId, detailsEndpoint } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => markLostFoundReturned(postId),

    onSuccess: (response) => {
      const post = response?.data;

      toast.success(response?.message?.trim?.() ? response.message : "تم تحديث حالة الإعلان");

      /* The details cache is keyed by the module's own endpoint — the same
         string `useDynamicDetails` reads with. Writing the server's payload in
         means the page updates without a refetch, and a refetch later agrees. */
      if (post && detailsEndpoint) {
        queryClient.setQueryData(["dynamic-details", detailsEndpoint], (current) =>
          current ? { ...current, data: post } : { success: true, data: post }
        );
      }

      /* Everywhere else this post is drawn from a list. */
      queryClient.invalidateQueries({ queryKey: ["dynamic-list"] });

      queryClient.invalidateQueries({ queryKey: ["marketplace-feed"] });

      queryClient.invalidateQueries({ queryKey: ["similar-advertisements"] });

      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },

    onError: (error) => {
      reportApiError(error, {
        fallback: "تعذّر تحديث حالة الإعلان. حاول مرة أخرى.",
      });
    },
  });

  return {
    markReturned: mutation.mutate,
    isPending: mutation.isPending,
  };
}
