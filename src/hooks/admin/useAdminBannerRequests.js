import { useCallback } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  approveBannerPayment,
  approveBannerRequest,
  deleteBannerRequest,
  expireBannerRequest,
  getAdminBannerAvailability,
  getAdminBannerCenter,
  getAdminBannerRequest,
  getAdminBannerRequests,
  getBannerRejectionReasons,
  getBannerRequestStatuses,
  rejectBannerPayment,
  rejectBannerRequest,
} from "../../api/admin/banners/bannerRequestsEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

export const ADMIN_BANNERS_ROOT = ["admin-banners"];

export const bannerCenterKey = () => [...ADMIN_BANNERS_ROOT, "center"];

export const bannerRequestsListRoot = () => [
  ...ADMIN_BANNERS_ROOT,
  "requests",
];

export const bannerRequestsListKey = (filters) => [
  ...bannerRequestsListRoot(),
  filters,
];

export const bannerRequestKey = (id) => [
  ...ADMIN_BANNERS_ROOT,
  "request",
  String(id ?? ""),
];

export const bannerAvailabilityRoot = () => [
  ...ADMIN_BANNERS_ROOT,
  "availability",
];

export const bannerAvailabilityKey = (params) => [
  ...bannerAvailabilityRoot(),
  params,
];

export const bannerRejectionReasonsKey = () => [
  ...ADMIN_BANNERS_ROOT,
  "rejection-reasons",
];

export const bannerStatusesKey = () => [...ADMIN_BANNERS_ROOT, "statuses"];

export function useAdminBannerCenter({ enabled = true } = {}) {
  return useQuery({
    queryKey: bannerCenterKey(),
    queryFn: getAdminBannerCenter,
    enabled,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminBannerRequests({ filters, enabled = true }) {
  return useQuery({
    queryKey: bannerRequestsListKey(filters),
    queryFn: () => getAdminBannerRequests(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminBannerRequest({ id, enabled = true }) {
  return useQuery({
    queryKey: bannerRequestKey(id),
    queryFn: () => getAdminBannerRequest(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminBannerAvailability({ location, categoryId, subCategoryId }) {
  const params = { location, categoryId, subCategoryId };

  return useQuery({
    queryKey: bannerAvailabilityKey(params),
    queryFn: () => getAdminBannerAvailability(params),
    enabled: Boolean(location),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

export function useAdminBannerStatuses({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: bannerStatusesKey(),
    queryFn: getBannerRequestStatuses,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
  });

  return { statusesQuery: query, statuses: query.data?.data ?? [] };
}

/** The rejection vocabulary. Cached hard; it changes when the backend ships. */
export function useAdminBannerRejectionReasons({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: bannerRejectionReasonsKey(),
    queryFn: getBannerRejectionReasons,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
  });

  return { reasonsQuery: query, reasons: query.data?.data ?? [] };
}

function useBannerAction({
  mutationFn,
  successText,
  errorText,
  touchesSlots = false,
  onDone,
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,

    onSuccess: (response, variables) => {
      const id = typeof variables === "object" ? variables?.id : variables;

      if (response?.data) {
        queryClient.setQueryData(bannerRequestKey(id), response);
      }

      toast.success(apiMessage(response, successText));

      onDone?.(response, variables);
    },

    onError: (error) => {
      /* 409 from `approve` means the slot or window is gone. The server's own
         sentence is the useful one — it says which. Never replaced. */
      toast.error(apiError(error, errorText));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bannerRequestsListRoot() });

      queryClient.invalidateQueries({ queryKey: bannerCenterKey() });

      if (touchesSlots) {
        queryClient.invalidateQueries({ queryKey: bannerAvailabilityRoot() });
      }
    },
  });

  const submit = useCallback(
    (variables, options) => mutation.mutate(variables, options),
    [mutation]
  );

  return { mutation, submit };
}

export function useApproveBannerPayment({ onDone } = {}) {
  return useBannerAction({
    mutationFn: approveBannerPayment,
    successText: "تم اعتماد الدفع",
    errorText: "تعذّر اعتماد الدفع",
    onDone,
  });
}

export function useRejectBannerPayment({ onDone } = {}) {
  return useBannerAction({
    mutationFn: rejectBannerPayment,
    successText: "تم رفض إثبات الدفع",
    errorText: "تعذّر رفض إثبات الدفع",
    onDone,
  });
}

export function useApproveBanner({ onDone } = {}) {
  return useBannerAction({
    mutationFn: approveBannerRequest,
    successText: "تمت الموافقة على البانر",
    errorText: "تعذّرت الموافقة على البانر",
    touchesSlots: true,
    onDone,
  });
}

export function useRejectBanner({ onDone } = {}) {
  return useBannerAction({
    mutationFn: rejectBannerRequest,
    successText: "تم رفض البانر",
    errorText: "تعذّر رفض البانر",
    touchesSlots: true,
    onDone,
  });
}

export function useExpireBanner({ onDone } = {}) {
  return useBannerAction({
    mutationFn: expireBannerRequest,
    successText: "تم إنهاء البانر",
    errorText: "تعذّر إنهاء البانر",
    touchesSlots: true,
    onDone,
  });
}

export function useDeleteBannerRequest({ onDone } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteBannerRequest,

    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: bannerRequestKey(id) });

      toast.success(apiMessage(response, "تم حذف الطلب"));

      onDone?.(response);
    },

    onError: (error) => toast.error(apiError(error, "تعذّر حذف الطلب")),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bannerRequestsListRoot() });

      queryClient.invalidateQueries({ queryKey: bannerCenterKey() });

      queryClient.invalidateQueries({ queryKey: bannerAvailabilityRoot() });
    },
  });

  return { mutation, submit: mutation.mutate };
}

export function bannerErrorCopy(error) {
  const status = error?.response?.status;

  const message = apiError(error, "");

  if (status === 429) {
    return {
      title: "عدد كبير من الطلبات",
      description:
        message || "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
    };
  }

  if (status >= 500) {
    return {
      title: "خطأ في الخادم",
      description: message || "تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.",
    };
  }

  return {
    title: "تعذّر تحميل البيانات",
    description:
      message || "حدث خطأ أثناء جلب بيانات البانرات. تحقّق من الاتصال وحاول مرة أخرى.",
  };
}
