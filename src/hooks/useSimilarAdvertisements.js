import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { getSimilarAdvertisements } from "../api/advertisements/interactions";
import { buildListingCard } from "../utils/listingModel";
import { hydrateFavoriteStates } from "./useFavorite";
import useListingModuleType from "./useListingModuleType";

export const SIMILAR_ADVERTISEMENTS_KEY = "similar-advertisements";

/** One rail's worth per request. The endpoint paginates from there. */
export const SIMILAR_PAGE_SIZE = 12;

export const similarAdvertisementsKey = (id, type, pageIndex, pageSize) => [
  SIMILAR_ADVERTISEMENTS_KEY,
  id ? String(id) : null,
  Number.isFinite(type) ? type : null,
  pageIndex,
  pageSize,
];

export default function useSimilarAdvertisements({
  id,
  type = null,
  categoryId = null,
  subCategoryId = null,
  pageIndex = 1,
  pageSize = SIMILAR_PAGE_SIZE,
  enabled = true,
} = {}) {
  const queryClient = useQueryClient();

  /* Only consulted when the details payload could not name the module itself. */
  const { type: resolvedType, isResolved } = useListingModuleType(
    categoryId,
    subCategoryId
  );

  const moduleType = Number.isFinite(type) ? type : resolvedType;

  const canAsk = Boolean(id) && enabled && (Number.isFinite(type) || isResolved);

  const query = useInfiniteQuery({
    queryKey: similarAdvertisementsKey(id, moduleType, pageIndex, pageSize),

    initialPageParam: pageIndex,

    queryFn: ({ pageParam }) =>
      getSimilarAdvertisements(id, {
        pageIndex: pageParam,
        pageSize,
        type: moduleType,
      }),

    /* The server's own `hasNext`, and the page number it echoed back — not a
       count of what arrived. `undefined` is how React Query is told the list
       is finished. */
    getNextPageParam: (lastPage) => {
      const page = lastPage?.data;

      if (page?.hasNext !== true) return undefined;

      const current = Number(page.pageIndex);

      return Number.isFinite(current) ? current + 1 : undefined;
    },

    enabled: canAsk,

    retry: (failureCount, error) => {
      const status = Number(error?.response?.status);

      if (status >= 400 && status < 500) return false;

      return failureCount < 1;
    },

    staleTime: 1000 * 60 * 5,

    gcTime: 1000 * 60 * 30,

    refetchOnWindowFocus: false,
  });

  const pages = query.data?.pages;

  const rows = useMemo(
    () => (pages ?? []).flatMap((page) => page?.data?.items ?? []),
    [pages]
  );

  const items = useMemo(() => {
    const seen = new Set();

    return rows
      .filter((row) => {
        /* A guid can only be shown once, whatever the paging does. This is not
           a similarity judgement — the backend chose every row here; it is what
           keeps React keys unique across appended pages. */
        const key = String(row?.id ?? "");

        if (!key || seen.has(key)) return false;

        seen.add(key);

        return true;
      })
      .map((row) => {
        const card = buildListingCard(row, { key: "similar" });

        if (!card) return null;

        return {
          ...card,
          /* The module label the API sent, for the chip on the rail. Cross-
             module results are normal here, so "which kind of listing is this"
             is worth stating — in the server's own words, in either language. */
          typeName: row.typeName ?? null,
          typeNameAr: row.typeNameAr ?? null,
        };
      })
      .filter(Boolean);
  }, [rows]);

  /* These rows state each ad's favourite status, so every heart in the rail is
     right on first paint instead of asking per card. Same thing the favourites
     and recently-viewed lists do with their replies. */
  useEffect(() => {
    hydrateFavoriteStates(queryClient, rows);
  }, [rows, queryClient]);

  const last = pages?.[pages.length - 1]?.data;

  return {
    items,

    pagination: {
      pageIndex: last?.pageIndex ?? pageIndex,
      pageSize: last?.pageSize ?? pageSize,
      totalCount: last?.totalCount ?? 0,
      totalPages: last?.totalPages ?? 0,
      hasNext: last?.hasNext ?? false,
      hasPrevious: last?.hasPrevious ?? false,
    },

    /* True until the server has answered for *this* ad, including while the
       module type is still being resolved — a rail that rendered "no similar
       ads" in that gap would be stating something nobody has said yet. */
    isLoading: canAsk && query.isPending,

    isFetching: query.isFetching,

    isError: query.isError,

    error: query.error,

    refetch: query.refetch,

    loadMore: query.fetchNextPage,
    hasMore: query.hasNextPage === true,
    isLoadingMore: query.isFetchingNextPage,
  };
}
