import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createPostComment,
  deletePostComment,
  getPostComments,
  updatePostComment,
} from "../api/interactions/postInteractions";

/** Shared so every caller of one collection's comments agrees on one entry. */
export const postCommentsKey = (collection, postId) => [
  "post-comments",
  collection,
  postId,
];

/** The page size read-config declares for the paginated collection. */
const PAGE_SIZE = 10;

export default function usePostComments({
  collection,
  postId,
  isPaginated = false,
  enabled = false,
} = {}) {
  const queryClient = useQueryClient();

  const queryKey = postCommentsKey(collection, postId);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,

    queryFn: ({ pageParam }) =>
      getPostComments(
        collection,
        postId,
        isPaginated ? { pageIndex: pageParam, pageSize: PAGE_SIZE } : null
      ),

    initialPageParam: 1,

    getNextPageParam: (lastPage, allPages) => {
      if (!isPaginated) return undefined;

      return lastPage?.data?.hasNext ? allPages.length + 1 : undefined;
    },

    enabled: Boolean(collection) && Boolean(postId) && enabled,

    staleTime: 1000 * 60,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  /* One flat list, whichever shape the pages arrived in. */
  const comments =
    data?.pages?.flatMap((page) =>
      Array.isArray(page?.data) ? page.data : (page?.data?.items ?? [])
    ) ?? [];

  const totalCount = isPaginated
    ? (data?.pages?.[0]?.data?.totalCount ?? comments.length)
    : comments.length;

  /** Append into the last page, so page boundaries stay where the server put them. */
  const appendToCache = useCallback(
    (created) =>
      queryClient.setQueryData(queryKey, (current) => {
        if (!current?.pages?.length) {
          return {
            pages: [{ success: true, data: isPaginated ? { items: [created] } : [created] }],
            pageParams: [1],
          };
        }

        const pages = [...current.pages];

        const last = pages[pages.length - 1];

        pages[pages.length - 1] = Array.isArray(last.data)
          ? { ...last, data: [...last.data, created] }
          : {
              ...last,
              data: {
                ...last.data,
                items: [...(last.data?.items ?? []), created],
                totalCount: Number(last.data?.totalCount ?? 0) + 1,
              },
            };

        return { ...current, pages };
      }),
    [queryClient, queryKey, isPaginated]
  );

  /** Drop one comment from whichever page is holding it. */
  const removeFromCache = useCallback(
    (commentId) =>
      queryClient.setQueryData(queryKey, (current) => {
        if (!current?.pages?.length) return current;

        return {
          ...current,
          pages: current.pages.map((page) =>
            Array.isArray(page.data)
              ? { ...page, data: page.data.filter((row) => row.id !== commentId) }
              : {
                  ...page,
                  data: {
                    ...page.data,
                    items: (page.data?.items ?? []).filter(
                      (row) => row.id !== commentId
                    ),
                    totalCount: Math.max(
                      0,
                      Number(page.data?.totalCount ?? 0) - 1
                    ),
                  },
                }
          ),
        };
      }),
    [queryClient, queryKey]
  );

  /** Swap one comment for the server's updated copy, wherever it is paged. */
  const replaceInCache = useCallback(
    (commentId, updated) =>
      queryClient.setQueryData(queryKey, (current) => {
        if (!current?.pages?.length) return current;

        const merge = (row) =>
          row.id === commentId ? { ...row, ...updated } : row;

        return {
          ...current,
          pages: current.pages.map((page) =>
            Array.isArray(page.data)
              ? { ...page, data: page.data.map(merge) }
              : {
                  ...page,
                  data: {
                    ...page.data,
                    items: (page.data?.items ?? []).map(merge),
                  },
                }
          ),
        };
      }),
    [queryClient, queryKey]
  );

  const { mutateAsync: submit, isPending: isSubmitting } = useMutation({
    mutationFn: (comment) => createPostComment(collection, postId, comment),

    onSuccess: (response) => {
      const created = response?.data;

      if (created) appendToCache(created);
    },
  });

  const {
    mutateAsync: update,
    isPending: isUpdating,
    variables: updatingVariables,
  } = useMutation({
    mutationFn: ({ commentId, comment }) =>
      updatePostComment(collection, postId, commentId, comment),

    /* The server answers with the updated row; write that in rather than
       refetching the thread and losing the reader's place in it. Falls back to
       the text just sent when the response carries no body. */
    onSuccess: (response, { commentId, comment }) =>
      replaceInCache(commentId, response?.data ?? { comment }),
  });

  const { mutateAsync: remove, isPending: isDeleting, variables: deletingId } =
    useMutation({
      mutationFn: (commentId) =>
        deletePostComment(collection, postId, commentId),

      // The server has accepted it; drop it locally rather than refetching the
      // whole thread and losing the reader's place in it.
      onSuccess: (_response, commentId) => removeFromCache(commentId),
    });

  return {
    comments,
    totalCount,
    isLoading,
    isFetching,
    isError,
    refetch,
    submit,
    isSubmitting,
    remove,
    isDeleting,
    deletingId: isDeleting ? deletingId : null,
    update,
    isUpdating,
    updatingId: isUpdating ? updatingVariables?.commentId ?? null : null,
    hasNextPage: Boolean(hasNextPage),
    loadMore: fetchNextPage,
    isFetchingNextPage,
  };
}
