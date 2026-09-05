import { useQueries, useQuery } from "@tanstack/react-query";

import {
  getAdminAds,
  getAdminPendingCount,
} from "../../api/admin/ads/adminAdsEndpoints";
import { adminAdsStatKey, adminPendingCountKey } from "./adminAdsKeys";
import { LISTING_STATUS, MODERATION_STATUS } from "../../pages/Admin/Ads/adminAdsConstants";

const COUNT_ONLY = { pageIndex: 1, pageSize: 1 };

const CARDS = [
  { key: "total", label: "إجمالي الإعلانات", filters: {} },
  { key: "active", label: "نشطة", filters: { status: LISTING_STATUS.active } },
  {
    key: "rejected",
    label: "مرفوضة",
    filters: { moderationStatus: MODERATION_STATUS.rejected },
  },
  {
    key: "suspended",
    label: "موقوفة",
    filters: { moderationStatus: MODERATION_STATUS.suspended },
  },
  { key: "expired", label: "منتهية", filters: { status: LISTING_STATUS.expired } },
];

const SHARED = {
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 5,
  retry: (failureCount, error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) return false;

    return failureCount < 1;
  },
};

/** The pending badge. Its own hook because the tab strip wants it too. */
export function useAdminPendingCount({ enabled = true } = {}) {
  return useQuery({
    queryKey: adminPendingCountKey(),
    queryFn: getAdminPendingCount,
    enabled,
    ...SHARED,
  });
}

export default function useAdminAdsStats({ enabled = true } = {}) {
  const pendingQuery = useAdminPendingCount({ enabled });

  const results = useQueries({
    queries: CARDS.map((card) => {
      const filters = { ...card.filters, ...COUNT_ONLY };

      return {
        queryKey: adminAdsStatKey(filters),
        queryFn: () => getAdminAds(filters),
        enabled,
        ...SHARED,
      };
    }),
  });

  const cards = CARDS.map((card, index) => {
    const result = results[index];

    return {
      key: card.key,
      label: card.label,
      // `totalCount` is the server's count for this filter, not a page length.
      value:
        typeof result.data?.data?.totalCount === "number"
          ? result.data.data.totalCount
          : null,
      isLoading: result.isLoading,
      isError: result.isError,
    };
  });

  const pendingValue =
    typeof pendingQuery.data?.data === "number" ? pendingQuery.data.data : null;

  /* Pending sits second — after the total, ahead of every other state — because
     it is the only card that is a queue rather than a tally. */
  const pendingCard = {
    key: "pending",
    label: "قيد المراجعة",
    value: pendingValue,
    isLoading: pendingQuery.isLoading,
    isError: pendingQuery.isError,
  };

  return {
    cards: [cards[0], pendingCard, ...cards.slice(1)],
    pendingCount: pendingValue,
    pendingQuery,
    isLoading: pendingQuery.isLoading || results.some((r) => r.isLoading),
  };
}
