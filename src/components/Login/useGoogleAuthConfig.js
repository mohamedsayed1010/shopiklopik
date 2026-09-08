import { useQuery } from "@tanstack/react-query";

import { getGoogleAuthConfig } from "../../api/auth/googleConfig";

/**
 * The Google client this deployment signs in against. Cached for the session —
 * it is a deployment setting, not something that changes while a reader is
 * looking at the form.
 */
export default function useGoogleAuthConfig() {
  const query = useQuery({
    queryKey: ["auth", "google-config"],
    queryFn: getGoogleAuthConfig,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const config = query.data?.data ?? null;

  return {
    /* Both halves are needed: a client id nobody enabled is still off, and an
       enabled flag with no client id has nothing to render. */
    enabled: Boolean(config?.enabled && config?.clientId),
    clientId: config?.clientId ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
