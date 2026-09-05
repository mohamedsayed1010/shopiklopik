import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getAdminAds,
  getAdminPendingAds,
} from "../../api/admin/ads/adminAdsEndpoints";
import { adminAdsListKey } from "./adminAdsKeys";

export default function useAdminAds({ endpoint = "all", filters, enabled = true }) {
  return useQuery({
    queryKey: adminAdsListKey(endpoint, filters),
    queryFn: () =>
      endpoint === "pending" ? getAdminPendingAds(filters) : getAdminAds(filters),
    enabled,
    placeholderData: keepPreviousData,
    // Moderation is a live queue — short enough to stay current, long enough
    // that switching tabs back and forth is not a refetch each time.
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 5,
    // A 403 is an answer, not a hiccup: retrying it just delays the message.
    retry: (failureCount, error) => {
      const status = error?.response?.status;

      if (status === 401 || status === 403 || status === 404) return false;

      return failureCount < 2;
    },
  });
}
