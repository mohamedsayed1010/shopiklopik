import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getAdvertisers } from "../api/categories/lookups";

/** The lookup's own default page size, as read-config publishes it. */
const PAGE_SIZE = 20;

/* A 4xx is an answer, not a hiccup: 400 means the section has no advertiser
   filter, 404 an unknown section, and 429 the rate limiter — asking again at
   once only feeds it. A network error or a 5xx gets one more try. */
function shouldRetry(failureCount, error) {
  const status = error?.response?.status;

  if (status && status < 500) return false;

  return failureCount < 1;
}

/**
 * The advertisers of one sub-category, from
 * `/api/lookups/advertisers/{categoryId}/{subCategoryId}`, a page at a time.
 * `search` narrows them on the server; the caller debounces it.
 */
export default function useAdvertiserOptions(
  categoryId,
  subCategoryId,
  { search = "", enabled = true } = {}
) {
  const term = String(search ?? "").trim();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "advertisers",
      categoryId,
      subCategoryId,
      term,
      PAGE_SIZE,
    ],

    queryFn: ({ pageParam }) =>
      getAdvertisers(categoryId, subCategoryId, {
        search: term,
        pageIndex: pageParam,
        pageSize: PAGE_SIZE,
      }),

    initialPageParam: 1,

    getNextPageParam: (lastPage) =>
      lastPage?.data?.hasNext ? lastPage.data.pageIndex + 1 : undefined,

    enabled: Boolean(categoryId) && Boolean(subCategoryId) && enabled,

    staleTime: 1000 * 60 * 5,

    retry: shouldRetry,

    refetchOnWindowFocus: false,
  });

  /* The id is what the filter is set to and the name is what the reader
     sees. Pages can overlap when a listing lands between two requests, so an
     id already listed is not listed twice. */
  const options = useMemo(() => {
    const byId = new Map();

    (data?.pages ?? []).forEach((page) => {
      (page?.data?.items ?? []).forEach((advertiser) => {
        const id = advertiser?.id;

        if (id === undefined || id === null || id === "" || byId.has(id)) {
          return;
        }

        byId.set(id, {
          value: id,
          label: String(advertiser.name ?? "").trim() || String(id),
        });
      });
    });

    return [...byId.values()];
  }, [data]);

  return {
    options,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
  };
}
