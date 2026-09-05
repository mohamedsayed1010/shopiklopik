import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getPublicSettings } from "../api/settings/publicSettings";
import { resolveSiteSettings, socialLinksFrom } from "../utils/siteSettings";

export const PUBLIC_SETTINGS_KEY = ["public-settings"];

const SETTINGS_REFRESH_MS = 1000 * 60;

export default function useSiteSettings() {
  const query = useQuery({
    queryKey: PUBLIC_SETTINGS_KEY,
    queryFn: getPublicSettings,
    staleTime: SETTINGS_REFRESH_MS,
    gcTime: 1000 * 60 * 30,
    /* Settings are chrome: a failure should leave the page usable, not retry
       into a spinner. 4xx is an answer and is never retried. */
    retry: (failureCount, error) => {
      const status = error?.response?.status;

      if (status >= 400 && status < 500) return false;

      return failureCount < 1;
    },
  });

  const payload = query.data?.data ?? null;

  const settings = useMemo(() => resolveSiteSettings(payload), [payload]);

  const socialLinks = useMemo(() => socialLinksFrom(settings), [settings]);

  return {
    settings,
    socialLinks,

    /** True once the server's own values are what is being rendered. */
    isFromApi: Boolean(payload),

    isLoading: query.isLoading,

    query,
  };
}
