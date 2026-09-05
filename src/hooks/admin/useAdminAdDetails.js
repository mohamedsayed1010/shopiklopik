import { useQuery } from "@tanstack/react-query";

import { getAdminAdDetails } from "../../api/admin/ads/adminAdsEndpoints";
import { adminAdDetailsKey } from "./adminAdsKeys";

export default function useAdminAdDetails({ type, id }) {
  const enabled = Boolean(type != null && id);

  return useQuery({
    queryKey: adminAdDetailsKey(type, id),
    queryFn: () => getAdminAdDetails({ type, id }),
    enabled,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      const status = error?.response?.status;

      if (status === 401 || status === 403 || status === 404) return false;

      return failureCount < 2;
    },
  });
}
