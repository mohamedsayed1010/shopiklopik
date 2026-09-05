import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  cancelBannerBooking,
  createBannerBooking,
  getBannerAvailability,
  getBannerBooking,
  getBannerPaymentMethods,
  getBannerQuote,
  getMyBannerBookings,
  previewBannerImages,
} from "../api/banners/bannerBookings";
import { BANNERS_ROOT, BOOKINGS_ROOT } from "./useBanners";
import { apiError, apiMessage } from "../pages/Profile/profileCache";

export const availabilityKey = (location, categoryId, subCategoryId) => [
  ...BOOKINGS_ROOT,
  "availability",
  location ?? null,
  categoryId ?? null,
  subCategoryId ?? null,
];

export const bannerPaymentMethodsKey = () => [
  ...BOOKINGS_ROOT,
  "payment-methods",
];

export const quoteKey = (selection) => [...BOOKINGS_ROOT, "quote", selection];

/** The advertiser's own bookings, keyed on the status filter they asked for. */
export const myBannerBookingsKey = (status) => [
  ...BOOKINGS_ROOT,
  "my",
  status ?? null,
];

export const bannerBookingKey = (id) => [
  ...BOOKINGS_ROOT,
  "booking",
  String(id ?? ""),
];

/** Settled answers; retrying them is noise. */
function bookingRetry(failureCount, error) {
  const status = error?.response?.status;

  if (status >= 400 && status < 500) return false;

  return failureCount < 1;
}

export function useBannerAvailability({ location, categoryId, subCategoryId }) {
  return useQuery({
    queryKey: availabilityKey(location, categoryId, subCategoryId),
    queryFn: () => getBannerAvailability({ location, categoryId, subCategoryId }),
    enabled: Boolean(location),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: bookingRetry,
  });
}

export function useBannerPaymentMethods({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: bannerPaymentMethodsKey(),
    queryFn: getBannerPaymentMethods,
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: bookingRetry,
  });

  return { methodsQuery: query, methods: query.data?.data ?? [] };
}

export function useBannerQuote({
  location,
  slotNumber,
  categoryId,
  subCategoryId,
  paymentMethodId,
}) {
  const selection = {
    location,
    slotNumber,
    categoryId,
    subCategoryId,
    paymentMethodId,
  };

  return useQuery({
    queryKey: quoteKey(selection),
    queryFn: () => getBannerQuote(selection),
    enabled: Boolean(location) && Boolean(slotNumber) && Boolean(paymentMethodId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: bookingRetry,
  });
}

export function useMyBannerBookings({ status, enabled = true } = {}) {
  const query = useQuery({
    queryKey: myBannerBookingsKey(status),
    queryFn: () => getMyBannerBookings({ status }),
    enabled,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: bookingRetry,
  });

  return { bookingsQuery: query, bookings: query.data?.data ?? [] };
}

export function useBannerBookingDetails({ id, enabled = true } = {}) {
  const query = useQuery({
    queryKey: bannerBookingKey(id),
    queryFn: () => getBannerBooking(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 5,
    retry: bookingRetry,
  });

  return { bookingQuery: query, booking: query.data?.data ?? null };
}

export function useCancelBannerBooking({ onDone } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: cancelBannerBooking,

    onSuccess: (response, id) => {
      if (response?.data) {
        queryClient.setQueryData(bannerBookingKey(id), response);
      }

      toast.success(apiMessage(response, "تم إلغاء الحجز"));

      onDone?.(response?.data);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر إلغاء الحجز")),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_ROOT });

      queryClient.invalidateQueries({ queryKey: BANNERS_ROOT });
    },
  });

  return { mutation, submit: mutation.mutate, isPending: mutation.isPending };
}

export function useBannerImagePreview() {
  const mutation = useMutation({
    mutationFn: previewBannerImages,

    onError: (error) => toast.error(apiError(error, "تعذّر فحص الصور")),
  });

  return { mutation, submit: mutation.mutate };
}

export function useCreateBannerBooking({ onDone } = {}) {
  const queryClient = useQueryClient();

  const [progress, setProgress] = useState(null);

  const mutation = useMutation({
    mutationFn: (values) =>
      createBannerBooking(values, (event) => {
        if (!event?.total) return;

        setProgress(Math.round((event.loaded * 100) / event.total));
      }),

    onMutate: () => setProgress(0),

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم إرسال طلب الحجز للمراجعة"));

      onDone?.(response?.data);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر إرسال طلب الحجز")),

    onSettled: () => {
      setProgress(null);

      queryClient.invalidateQueries({ queryKey: BOOKINGS_ROOT });

      queryClient.invalidateQueries({ queryKey: BANNERS_ROOT });
    },
  });

  const submit = useCallback(
    (values, options) => mutation.mutate(values, options),
    [mutation]
  );

  return { mutation, submit, progress };
}
