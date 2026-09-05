import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getAdvertisementRating,
  getAdvertisementRatings,
  rateAdvertisement,
  removeAdvertisementRating,
} from "../api/advertisements/ratings";
import useListingModuleType from "./useListingModuleType";
import { apiError, apiMessage } from "../pages/Profile/profileCache";

export const ADVERTISEMENT_RATING_KEY = "advertisement-rating";

export const ADVERTISEMENT_RATINGS_KEY = "advertisement-ratings";

export const ADVERTISEMENT_RATINGS_MY_KEY = "advertisement-ratings-my";

export const advertisementRatingKey = (id, type) => [
  ADVERTISEMENT_RATING_KEY,
  id ? String(id) : null,
  Number.isFinite(type) ? type : null,
];

export const advertisementRatingsKey = (
  id,
  type,
  { rating = null, pageIndex = 1, pageSize = 10 } = {}
) => [
  ADVERTISEMENT_RATINGS_KEY,
  id ? String(id) : null,
  Number.isFinite(type) ? type : null,
  Number.isFinite(rating) ? rating : null,
  pageIndex,
  pageSize,
];

export default function useAdvertisementRating({
  id,
  type = null,
  categoryId = null,
  subCategoryId = null,
  enabled = true,
} = {}) {
  const queryClient = useQueryClient();

  const { type: resolvedType, isResolved } = useListingModuleType(
    categoryId,
    subCategoryId
  );

  const moduleType = Number.isFinite(type) ? type : resolvedType;

  const canAsk = Boolean(id) && enabled && (Number.isFinite(type) || isResolved);

  const summaryQuery = useQuery({
    queryKey: advertisementRatingKey(id, moduleType),

    queryFn: () => getAdvertisementRating(id, moduleType),

    enabled: canAsk,

    /* Short, like the actions query beside it: both writes below invalidate
       this, and it is the authority every figure on the panel is painted
       from. */
    staleTime: 1000 * 30,

    gcTime: 1000 * 60 * 10,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  /** The one ad's list entries, plus any account-scoped view of my ratings. */
  const refreshLists = () => {
    queryClient.invalidateQueries({
      queryKey: [ADVERTISEMENT_RATINGS_KEY, id ? String(id) : null],
    });

    queryClient.invalidateQueries({
      queryKey: [ADVERTISEMENT_RATINGS_MY_KEY],
    });
  };

  const submitMutation = useMutation({
    mutationFn: (rating) =>
      rateAdvertisement(id, { type: moduleType, rating }),

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم إرسال تقييمك"));

      /* Not a complete summary — no `breakdown`, no `myRating` — so this is
         re-read rather than patched. One request, for this ad only. */
      queryClient.invalidateQueries({
        queryKey: advertisementRatingKey(id, moduleType),
      });

      refreshLists();
    },

    onError: (error) => toast.error(apiError(error, "تعذّر إرسال التقييم")),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeAdvertisementRating(id, moduleType),

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم حذف تقييمك"));

      /* The delete answers with the whole summary, so the panel repaints from
         the response itself and no re-read is needed. */
      if (response?.data) {
        queryClient.setQueryData(
          advertisementRatingKey(id, moduleType),
          response
        );
      } else {
        queryClient.invalidateQueries({
          queryKey: advertisementRatingKey(id, moduleType),
        });
      }

      refreshLists();
    },

    onError: (error) => toast.error(apiError(error, "تعذّر حذف التقييم")),
  });

  return {
    summary: summaryQuery.data?.data ?? null,

    isLoading: canAsk && summaryQuery.isPending,

    isError: summaryQuery.isError,

    refetch: summaryQuery.refetch,

    moduleType,

    canRate: canAsk,

    submit: submitMutation.mutate,

    remove: removeMutation.mutate,

    isSubmitting: submitMutation.isPending,

    isRemoving: removeMutation.isPending,
  };
}

export function useAdvertisementRatings({
  id,
  type = null,
  rating = null,
  pageIndex = 1,
  pageSize = 10,
  enabled = true,
} = {}) {
  const query = useQuery({
    queryKey: advertisementRatingsKey(id, type, { rating, pageIndex, pageSize }),

    queryFn: () =>
      getAdvertisementRatings(id, { type, rating, pageIndex, pageSize }),

    enabled: Boolean(id) && Number.isFinite(type) && enabled,

    staleTime: 1000 * 30,

    gcTime: 1000 * 60 * 10,

    retry: 1,

    refetchOnWindowFocus: false,

    /* Paging keeps the previous page on screen while the next one loads, so
       the panel does not collapse to a spinner between clicks. */
    placeholderData: (previous) => previous,
  });

  const page = query.data?.data ?? null;

  return {
    items: page?.items ?? [],

    page,

    isLoading: query.isPending,

    isFetching: query.isFetching,

    isError: query.isError,

    refetch: query.refetch,
  };
}

export function useCardRating({
  id,
  type = null,
  categoryId = null,
  subCategoryId = null,
  fallback,
} = {}) {
  const { type: resolvedType } = useListingModuleType(categoryId, subCategoryId);

  const moduleType = Number.isFinite(type) ? type : resolvedType;

  const { data } = useQuery({
    queryKey: advertisementRatingKey(id, moduleType),

    queryFn: () => null,

    enabled: false,

    staleTime: Infinity,

    /* Outlives the cards that read it — walking from a grid to a details page
       and back unmounts every one of them. */
    gcTime: Infinity,
  });

  const cached = data?.data;

  if (!cached) return fallback ?? { average: null, count: null };

  return {
    average: Number.isFinite(Number(cached.averageRating))
      ? Number(cached.averageRating)
      : null,
    count: Number.isFinite(Number(cached.ratingsCount))
      ? Number(cached.ratingsCount)
      : null,
  };
}
