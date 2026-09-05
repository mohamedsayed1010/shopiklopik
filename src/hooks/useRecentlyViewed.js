import { useContext, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import {
  clearRecentlyViewed,
  getRecentlyViewed,
  removeRecentlyViewed,
} from "../api/advertisements/interactions";
import { AuthContext } from "../context/AuthContext";
import { hydrateFavoriteStates } from "./useFavorite";
import { buildListingCard } from "../utils/listingModel";
import { formatRelativeTime } from "../utils/format";
import { apiErrorText } from "../utils/apiErrors";


export const RECENTLY_VIEWED_QUERY_KEY = ["recently-viewed"];

const LEGACY_STORAGE_KEY = "shobiklobik:recently-viewed";

try {
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
} catch {
  /* Private mode or a disabled store: nothing to clean up there anyway. */
}

/** One rail's worth. The endpoint paginates; the rail shows the first page. */
const DEFAULT_PAGE_SIZE = 12;

/* The shared reading — `errors` before `message` — rather than a private
   copy of the inverted one. */
const apiError = apiErrorText;

export default function useRecentlyViewed({
  pageIndex = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  type,
} = {}) {
  const queryClient = useQueryClient();

  /* The endpoint answers 401 without a session, and the app's interceptor
     treats a 401 as "refresh or sign out". Asking at all while signed out
     would be a pointless round trip on a route the reader cannot be on. */
  const { token } = useContext(AuthContext);

  const params = useMemo(
    () => ({ pageIndex, pageSize, ...(Number.isFinite(type) ? { type } : {}) }),
    [pageIndex, pageSize, type]
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [...RECENTLY_VIEWED_QUERY_KEY, params],

    queryFn: () => getRecentlyViewed(params),

    enabled: Boolean(token),

    /* Short: opening an ad changes this list, and the details page invalidates
       it on the way back. */
    staleTime: 1000 * 30,

    gcTime: 1000 * 60 * 10,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    const rows = data?.data?.items ?? [];

    return rows
      .map((row) => {
        const card = buildListingCard(row, { key: "recently-viewed" });

        if (!card) return null;

        return {
          ...card,
          type: row.type ?? null,
          lastViewedAt: row.lastViewedAt ?? null,
          timeText: row.lastViewedAt
            ? `شوهد ${formatRelativeTime(row.lastViewedAt)}`
            : card.timeText,
        };
      })
      .filter(Boolean);
  }, [data]);

  /* These rows are `ListingCardDto`s, so they state each ad's favourite status
     as well. Reading that out costs nothing and is the only thing this history
     lends to the favourites feature — the rail itself is unchanged. */
  useEffect(() => {
    hydrateFavoriteStates(queryClient, data?.data?.items ?? []);
  }, [data, queryClient]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: RECENTLY_VIEWED_QUERY_KEY });

  const removeMutation = useMutation({
    mutationFn: ({ id, type: itemType }) => removeRecentlyViewed(id, itemType),

    onSuccess: invalidate,

    /* The row stays on screen — the list is only re-read on success, so a
       failed delete leaves exactly what the server still holds. */
    onError: (error) =>
      toast.error(apiError(error, "تعذّر حذف الإعلان من السجل.")),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearRecentlyViewed(type),

    onSuccess: invalidate,

    onError: (error) => toast.error(apiError(error, "تعذّر مسح السجل.")),
  });

  return {
    items,

    count: items.length,

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
    refetch,

    /** Drop one ad from the history. `type` comes from the row the API sent. */
    remove: (id, itemType) => removeMutation.mutate({ id, type: itemType }),
    removingId: removeMutation.isPending ? removeMutation.variables?.id : null,

    clear: () => clearMutation.mutate(),
    isClearing: clearMutation.isPending,
  };
}
