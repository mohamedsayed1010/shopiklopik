import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getAdminSettings,
  getAdminUploadLimits,
  updateAdminSettings,
  uploadSettingsFavicon,
  uploadSettingsLogo,
} from "../../api/admin/settings/adminSettingsEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";
import { PUBLIC_SETTINGS_KEY } from "../useSiteSettings";

export const ADMIN_SETTINGS_KEY = ["admin-settings"];

export const adminUploadLimitsKey = () => [
  ...ADMIN_SETTINGS_KEY,
  "upload-limits",
];

export function serverErrorList(error) {
  const data = error?.response?.data;

  if (!Array.isArray(data?.errors)) return [];

  return data.errors.filter(
    (entry) => typeof entry === "string" && entry.trim()
  );
}

export function useAdminSettings({ enabled = true } = {}) {
  return useQuery({
    queryKey: ADMIN_SETTINGS_KEY,
    queryFn: getAdminSettings,
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: adminRetry,
  });
}

export function useAdminUploadLimits({ enabled = false } = {}) {
  return useQuery({
    queryKey: adminUploadLimitsKey(),
    queryFn: getAdminUploadLimits,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
  });
}

export function useSaveAdminSettings({ onSaved } = {}) {
  const queryClient = useQueryClient();

  const [fieldErrors, setFieldErrors] = useState([]);

  const mutation = useMutation({
    mutationFn: updateAdminSettings,

    onMutate: () => setFieldErrors([]),

    onSuccess: (response) => {
      if (response?.data) {
        queryClient.setQueryData(ADMIN_SETTINGS_KEY, response);
      }

      queryClient.invalidateQueries({ queryKey: PUBLIC_SETTINGS_KEY });

      toast.success(apiMessage(response, "تم حفظ الإعدادات"));

      onSaved?.(response);
    },

    onError: (error) => {
      setFieldErrors(serverErrorList(error));

      toast.error(apiError(error, "تعذّر حفظ الإعدادات"));
    },
  });

  const clearFieldErrors = useCallback(() => setFieldErrors([]), []);

  return { saveMutation: mutation, fieldErrors, clearFieldErrors };
}

function useBrandingUpload({ upload, successText, errorText }) {
  const queryClient = useQueryClient();

  const [progress, setProgress] = useState(null);

  const mutation = useMutation({
    mutationFn: (file) =>
      upload(file, (event) => {
        if (!event?.total) return;

        setProgress(Math.round((event.loaded * 100) / event.total));
      }),

    onMutate: () => setProgress(0),

    onSuccess: (response) => {
      if (response?.data) {
        queryClient.setQueryData(ADMIN_SETTINGS_KEY, response);
      }

      /* A logo or favicon upload changes `logoUrl` / `faviconUrl`, which the
         header, footer and document icon all read from the public entry — so
         it goes stale here for exactly the same reason a text save does. */
      queryClient.invalidateQueries({ queryKey: PUBLIC_SETTINGS_KEY });

      toast.success(apiMessage(response, successText));
    },

    onError: (error) => {
      const errors = serverErrorList(error);

      toast.error(errors[0] || apiError(error, errorText));
    },

    onSettled: () => setProgress(null),
  });

  return { mutation, progress };
}

export function useUploadSettingsLogo() {
  return useBrandingUpload({
    upload: uploadSettingsLogo,
    successText: "تم تحديث شعار الموقع",
    errorText: "تعذّر رفع الشعار",
  });
}

export function useUploadSettingsFavicon() {
  return useBrandingUpload({
    upload: uploadSettingsFavicon,
    successText: "تم تحديث أيقونة الموقع",
    errorText: "تعذّر رفع الأيقونة",
  });
}

/** Re-read the settings by hand. Covers the limits query too, by prefix. */
export function useRefreshAdminSettings() {
  const queryClient = useQueryClient();

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY }),
    [queryClient]
  );
}

export function settingsErrorCopy(error) {
  const status = error?.response?.status;

  const detail = serverErrorList(error)[0];

  if (status === 429) {
    return {
      title: "عدد كبير من الطلبات",
      description:
        detail ||
        "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
    };
  }

  if (status >= 500) {
    return {
      title: "خطأ في الخادم",
      description:
        detail || "تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.",
    };
  }

  if (status === 400 || status === 422) {
    return {
      title: "طلب غير مقبول",
      description: detail || apiError(error, "راجع البيانات المُرسلة."),
    };
  }

  return {
    title: "تعذّر تحميل الإعدادات",
    description:
      detail ||
      "حدث خطأ أثناء جلب إعدادات المنصة. تحقّق من الاتصال وحاول مرة أخرى.",
  };
}

export function useResolvedUploadLimits(settings) {
  const embedded = settings?.uploadLimits ?? null;

  const limitsQuery = useAdminUploadLimits({
    enabled: Boolean(settings) && !embedded,
  });

  const fetched = limitsQuery.data?.data ?? null;

  const limits = useMemo(() => embedded ?? fetched, [embedded, fetched]);

  return { limits, limitsQuery };
}
