import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getBannerPrice,
  getBannerPrices,
  updateBannerPrice,
} from "../../api/admin/banners/bannerPricesEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError } from "../../pages/Profile/profileCache";
import {
  ADMIN_BANNERS_ROOT,
  bannerAvailabilityRoot,
  bannerCenterKey,
} from "./useAdminBannerRequests";
import {
  BANNERS_ROOT,
  BOOKINGS_ROOT,
  bannerPlacementsKey,
} from "../useBanners";

export const BANNER_PRICES_ROOT = [...ADMIN_BANNERS_ROOT, "prices"];

export const bannerPricesKey = () => [...BANNER_PRICES_ROOT, "list"];

export const bannerPriceKey = (location) => [
  ...BANNER_PRICES_ROOT,
  "item",
  String(location ?? ""),
];

export function useAdminBannerPrices({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: bannerPricesKey(),
    queryFn: getBannerPrices,
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: adminRetry,
  });

  return { pricesQuery: query, placements: query.data?.data ?? [] };
}

export function useAdminBannerPrice({ location, seed, enabled = true }) {
  return useQuery({
    queryKey: bannerPriceKey(location),
    queryFn: () => getBannerPrice(location),
    enabled: Boolean(location) && enabled,
    placeholderData: seed ? { success: true, data: seed } : undefined,
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

const PRICE_FIELDS = ["price"];

const SIZE_FIELDS = [
  "desktopWidth",
  "desktopHeight",
  "mobileWidth",
  "mobileHeight",
];

function changed(before, after, fields) {
  if (!before) return false;

  return fields.some(
    (field) => String(before[field] ?? "") !== String(after?.[field] ?? "")
  );
}

export function placementUpdateMessage(before, after) {
  const priceMoved = changed(before, after, PRICE_FIELDS);

  const sizeMoved = changed(before, after, SIZE_FIELDS);

  if (priceMoved && !sizeMoved) return "تم تحديث سعر المساحة الإعلانية";

  if (sizeMoved && !priceMoved) return "تم تحديث أبعاد المساحة الإعلانية";

  return "تم تحديث المساحة الإعلانية";
}

export function useUpdateBannerPrice({ onDone } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateBannerPrice,

    onSuccess: (response, variables) => {
      // The PUT answers with the updated placement; adopt it rather than re-read.
      if (response?.data) {
        queryClient.setQueryData(bannerPriceKey(variables.location), response);
      }

      queryClient.invalidateQueries({ queryKey: bannerPlacementsKey() });

      queryClient.invalidateQueries({
        queryKey: [...BOOKINGS_ROOT, "availability"],
      });

      queryClient.invalidateQueries({ queryKey: BANNERS_ROOT });

      toast.success(
        placementUpdateMessage(variables.previous, variables.values)
      );

      onDone?.(response);
    },

    onError: (error) =>
      toast.error(apiError(error, "تعذّر تحديث إعدادات المساحة")),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bannerPricesKey() });

      /* Price and slot count are both reported by the center and both feed the
         availability calculation, so neither can be left as it was. */
      queryClient.invalidateQueries({ queryKey: bannerCenterKey() });

      queryClient.invalidateQueries({ queryKey: bannerAvailabilityRoot() });
    },
  });

  return { mutation, submit: mutation.mutate };
}
