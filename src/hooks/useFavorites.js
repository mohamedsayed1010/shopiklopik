import { useContext, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

import { getFavorites } from "../api/advertisements/interactions";
import { AuthContext } from "../context/AuthContext";
import { buildListingCard } from "../utils/listingModel";
import { hydrateFavoriteStates } from "./useFavorite";

export const FAVORITES_QUERY_KEY = ["favorites"];

export const FAVORITES_PAGE_SIZE = 12;

const LEGACY_STORAGE_KEYS = [
  "shobiklobik:saved-listings", // the card hearts' store
  "shobiklobik:saved-ads", // the details page's separate id list
];

try {
  LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
} catch {
  /* Private mode or a disabled store: nothing to clean up there anyway. */
}

export default function useFavorites({
  pageIndex = 1,
  pageSize = FAVORITES_PAGE_SIZE,
  type,
} = {}) {
  const queryClient = useQueryClient();

  /* The endpoint answers 401 without a session. */
  const { token } = useContext(AuthContext);

  const params = useMemo(
    () => ({ pageIndex, pageSize, ...(Number.isFinite(type) ? { type } : {}) }),
    [pageIndex, pageSize, type]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [...FAVORITES_QUERY_KEY, params],

    queryFn: () => getFavorites(params),

    enabled: Boolean(token),

    /* Page changes swap content in place instead of collapsing the grid back
       to skeletons — the same convention the profile's listings use. */
    placeholderData: keepPreviousData,

    staleTime: 1000 * 30,

    gcTime: 1000 * 60 * 10,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    const rows = data?.data?.items ?? [];

    return rows.map((row) => buildListingCard(row, { key: "favorites" })).filter(Boolean);
  }, [data]);

  /* Everything on this page is, by definition, favourited — so the reply is
     also the answer for every heart elsewhere in the app that shows one of
     these ads. Recorded once here rather than asked for again per card. */
  useEffect(() => {
    hydrateFavoriteStates(queryClient, data?.data?.items ?? []);
  }, [data, queryClient]);

  return {
    items,

    pagination: {
      pageIndex: data?.data?.pageIndex ?? pageIndex,
      pageSize: data?.data?.pageSize ?? pageSize,
      totalCount: data?.data?.totalCount ?? 0,
      totalPages: data?.data?.totalPages ?? 0,
      hasNext: data?.data?.hasNext ?? false,
      hasPrevious: data?.data?.hasPrevious ?? false,
    },

    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
