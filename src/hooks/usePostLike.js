import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { togglePostLike } from "../api/interactions/postInteractions";
import { patchListingEverywhere } from "../utils/listingCache";
import useRequireAuth from "./useRequireAuth";
import { reportApiError } from "../utils/reportApiError";

export default function usePostLike({
  collection,
  postId,
  liked = false,
  likesCount = 0,
} = {}) {
  const queryClient = useQueryClient();

  /* These bars ride on cards in the public listing pages, so the button is on
     screen for readers who have no session. */
  const { requireAuth } = useRequireAuth();

  const apply = useCallback(
    (nextLiked, nextCount) =>
      patchListingEverywhere(queryClient, postId, {
        isLikedByCurrentUser: nextLiked,
        likesCount: nextCount,
      }),
    [queryClient, postId]
  );

  const mutation = useMutation({
    mutationFn: () => togglePostLike(collection, postId),

    onMutate: () => {
      const previous = { liked: Boolean(liked), count: Number(likesCount) || 0 };

      // Never let an optimistic count fall below zero, even if the seed and
      // the server have drifted apart.
      apply(!previous.liked, Math.max(0, previous.count + (previous.liked ? -1 : 1)));

      return previous;
    },

    onSuccess: (response) => {
      const result = response?.data;

      // The server decides. An unexpected shape leaves the optimistic value
      // alone rather than overwriting it with nothing.
      if (!result || typeof result.liked !== "boolean") return;

      apply(
        result.liked,
        Number.isFinite(Number(result.likesCount))
          ? Number(result.likesCount)
          : Math.max(0, (Number(likesCount) || 0) + (result.liked ? 1 : -1))
      );
    },

    onError: (error, _variables, previous) => {
      // Rollback — the button must never claim something the server rejected.
      if (previous) apply(previous.liked, previous.count);

      reportApiError(error, { fallback: "تعذّر تسجيل الإعجاب. حاول مرة أخرى." });
    },
  });

  const { isPending, mutate } = mutation;

  const toggle = useCallback(() => {
    if (!collection || !postId || isPending) return;

    /* Before `mutate`, so the optimistic count in `onMutate` never moves for a
       request that was never going to be sent. */
    if (!requireAuth("سجّل دخولك للتفاعل مع المنشور")) return;

    mutate();
  }, [collection, postId, isPending, requireAuth, mutate]);

  return { isPending, toggle };
}
