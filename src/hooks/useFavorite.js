import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { addFavorite, removeFavorite } from "../api/advertisements/interactions";
import { patchListingEverywhere } from "../utils/listingCache";
import useListingModuleType from "./useListingModuleType";
import { FAVORITES_QUERY_KEY } from "./useFavorites";
import { ADVERTISEMENT_ACTIONS_KEY } from "./useAdvertisementActions";
import { reportApiError } from "../utils/reportApiError";

/** Where one ad's last server-confirmed favourite state is kept. */
export const favoriteStateKey = (id) => ["favorite-state", String(id)];

export function hydrateFavoriteStates(queryClient, rows) {
  if (!queryClient || !Array.isArray(rows)) return;

  rows.forEach((row) => {
    if (!row?.id || typeof row.isFavorite !== "boolean") return;

    const key = favoriteStateKey(row.id);

    if (queryClient.getQueryData(key) !== undefined) return;

    queryClient.setQueryData(key, {
      isFavorite: row.isFavorite,
      favoriteCount: Number.isFinite(Number(row.favoriteCount))
        ? Number(row.favoriteCount)
        : null,
    });
  });
}

export default function useFavorite({
  id,
  type = null,
  categoryId = null,
  subCategoryId = null,
  isFavorite: initialIsFavorite = false,
  favoriteCount: initialFavoriteCount = null,
}) {
  const queryClient = useQueryClient();

  /* Only consulted when the row itself did not name its module. */
  const { type: resolvedType, isResolved } = useListingModuleType(
    categoryId,
    subCategoryId
  );

  const moduleType = Number.isFinite(type) ? type : resolvedType;

  const canToggle = Boolean(id) && (Number.isFinite(type) || isResolved);

  const { data: confirmed } = useQuery({
    queryKey: favoriteStateKey(id),

    queryFn: () => null,

    enabled: false,

    staleTime: Infinity,

    /* Outlives the components that read it — the walk from a listing page to a
       details page unmounts every heart on the way. */
    gcTime: Infinity,
  });

  const [isPending, setIsPending] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  /* A confirmed answer always beats the payload, including when the payload
     simply did not mention favourites. */
  const isFavorite = confirmed
    ? confirmed.isFavorite === true
    : initialIsFavorite === true;

  const favoriteCount = confirmed ? confirmed.favoriteCount : initialFavoriteCount;

  const toggle = useCallback(async () => {
    if (!canToggle || isPending) return null;

    setIsPending(true);

    try {
      const response = isFavorite
        ? await removeFavorite(id, moduleType)
        : await addFavorite(id, moduleType);

      const data = response?.data;

      if (!data || typeof data.isFavorite !== "boolean") return null;

      const count = Number.isFinite(Number(data.favoriteCount))
        ? Number(data.favoriteCount)
        : null;

      /* The record every heart for this ad reads, on any page. Written to the
         cache rather than to component state so it outlives this component. */
      queryClient.setQueryData(favoriteStateKey(id), {
        isFavorite: data.isFavorite,
        favoriteCount: count,
      });

      /* Every other copy of this ad on screen, and the favourites list. */
      patchListingEverywhere(queryClient, id, {
        isFavorite: data.isFavorite,
        ...(count === null ? {} : { favoriteCount: count }),
      });

      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });

      /* The actions endpoint reports this ad's favourite state and count, so
         it is now stale for every id — cheap to mark, and it is what a details
         page re-reads on its next mount. */
      queryClient.invalidateQueries({ queryKey: [ADVERTISEMENT_ACTIONS_KEY] });

      return data;
    } catch (error) {
      /* Nothing was changed optimistically, so there is nothing to roll back —
         the heart still shows what the server last confirmed. */
      reportApiError(error, { fallback: "تعذّر تحديث المفضلة. حاول مرة أخرى." });

      return null;
    } finally {
      if (isMounted.current) setIsPending(false);
    }
  }, [canToggle, isPending, isFavorite, id, moduleType, queryClient]);

  return { isFavorite, favoriteCount, toggle, isPending, canToggle };
}
