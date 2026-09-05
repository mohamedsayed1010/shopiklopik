import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getActiveBanners,
  getBannerPlacements,
  getHomeSlider1Banners,
  getHomeSlider2Banners,
  getSubCategoryBanners,
} from "../api/banners/bannerAdvertisements";
import { PLACEMENT_KEYS, resolvePlacement } from "../utils/bannerPlacements";

export const BANNERS_ROOT = ["banner-advertisements"];

export const BOOKINGS_ROOT = ["banner-bookings"];

export const bannerPlacementsKey = () => [...BOOKINGS_ROOT, "placements"];

export const homeSlider1Key = () => [...BANNERS_ROOT, "home-slider-1"];

export const homeSlider2Key = () => [...BANNERS_ROOT, "home-slider-2"];

export const subCategoryBannersKey = (categoryId, subCategoryId) => [
  ...BANNERS_ROOT,
  "sub-category",
  categoryId ?? null,
  subCategoryId ?? null,
];

export const activeBannersKey = (location, categoryId, subCategoryId) => [
  ...BANNERS_ROOT,
  "active",
  location ?? null,
  categoryId ?? null,
  subCategoryId ?? null,
];

const BANNER_REFRESH_MS = 1000 * 30;

const BANNER_QUERY = {
  staleTime: BANNER_REFRESH_MS,
  gcTime: 1000 * 60 * 30,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  /* 4xx here means "no banners for this placement", which is an answer, not an
     outage — retrying it just delays the empty state. */
  retry: (failureCount, error) => {
    const status = error?.response?.status;

    if (status >= 400 && status < 500) return false;

    return failureCount < 1;
  },
};

export function useBannerPlacements({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: bannerPlacementsKey(),
    queryFn: getBannerPlacements,
    enabled,
    ...BANNER_QUERY,
  });

  return { placementsQuery: query, placements: query.data?.data ?? [] };
}

export function useHomeBannerSlider1({ enabled = true } = {}) {
  return useQuery({
    queryKey: homeSlider1Key(),
    queryFn: getHomeSlider1Banners,
    enabled,
    ...BANNER_QUERY,
  });
}

export function useHomeBannerSlider2({ enabled = true } = {}) {
  return useQuery({
    queryKey: homeSlider2Key(),
    queryFn: getHomeSlider2Banners,
    enabled,
    ...BANNER_QUERY,
  });
}

/** Both ids are required, so the query stays idle until they exist. */
export function useSubCategoryBanners({ categoryId, subCategoryId, enabled = true }) {
  return useQuery({
    queryKey: subCategoryBannersKey(categoryId, subCategoryId),
    queryFn: () => getSubCategoryBanners({ categoryId, subCategoryId }),
    enabled: enabled && Boolean(categoryId) && Boolean(subCategoryId),
    ...BANNER_QUERY,
  });
}

export function useActiveBanners({
  location,
  categoryId,
  subCategoryId,
  enabled = true,
}) {
  return useQuery({
    queryKey: activeBannersKey(location, categoryId, subCategoryId),
    queryFn: () => getActiveBanners({ location, categoryId, subCategoryId }),
    enabled: enabled && Boolean(location),
    ...BANNER_QUERY,
  });
}

export function useBannerSlot({ placementKey, categoryId, subCategoryId }) {
  const { placements, placementsQuery } = useBannerPlacements();

  const placement = useMemo(
    () => resolvePlacement(placements, placementKey),
    [placements, placementKey]
  );

  const isSlider1 = placementKey === PLACEMENT_KEYS.homeSlider1;

  const isSlider2 = placementKey === PLACEMENT_KEYS.homeSlider2;

  const isSubCategory = placementKey === PLACEMENT_KEYS.subCategory;

  const slider1 = useHomeBannerSlider1({ enabled: isSlider1 });

  const slider2 = useHomeBannerSlider2({ enabled: isSlider2 });

  const subCategory = useSubCategoryBanners({
    categoryId,
    subCategoryId,
    enabled: isSubCategory,
  });

  /* The fallback for any placement the backend adds later, which by definition
     has no dedicated route yet. Disabled for the three that do have one. */
  const active = useActiveBanners({
    location: placement?.location,
    categoryId,
    subCategoryId,
    enabled: !isSlider1 && !isSlider2 && !isSubCategory,
  });

  const query = isSlider1
    ? slider1
    : isSlider2
    ? slider2
    : isSubCategory
    ? subCategory
    : active;

  const banners = useMemo(() => query.data?.data ?? [], [query.data]);

  return {
    banners,
    placement,
    query,
    /* The catalogue has to land before a placement can be named, so the slot
       is still "loading" while it does. */
    isLoading: query.isLoading || placementsQuery.isLoading,
    isError: query.isError,
  };
}
