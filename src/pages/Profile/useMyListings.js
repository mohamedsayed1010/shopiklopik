import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getMyListings } from "../../api/profile/getMyListings";
import { deleteListing, republishListing } from "../../api/profile/listingActions";
import {
  MY_LISTINGS_QUERY_KEY,
  PROFILE_QUERY_KEY,
  apiError,
  apiMessage,
} from "./profileCache";

export function useMyListings({ pageIndex = 1, pageSize = 8 } = {}) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [...MY_LISTINGS_QUERY_KEY, pageIndex, pageSize],
    queryFn: () => getMyListings({ pageIndex, pageSize }),
    // Page changes swap content in place instead of collapsing the section
    // back to skeletons.
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });

  const page = data?.data ?? null;

  return {
    listings: page?.items ?? [],
    page,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}

export function useListingActions() {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: MY_LISTINGS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  };

  const deleteMutation = useMutation({
    mutationFn: ({ endpoint }) => deleteListing(endpoint),

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم حذف الإعلان"));

      refreshAll();
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر حذف الإعلان"));
    },
  });

  const republishMutation = useMutation({
    mutationFn: ({ endpoint }) => republishListing(endpoint),

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم إعادة نشر الإعلان"));

      refreshAll();
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر إعادة نشر الإعلان"));
    },
  });

  return { deleteMutation, republishMutation };
}

export default useMyListings;
