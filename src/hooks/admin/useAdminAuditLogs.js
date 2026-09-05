import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getAdminAuditLogs } from "../../api/admin/auditLogs/adminAuditLogsEndpoints";
import { adminAuditListKey } from "./adminAuditLogsKeys";

/** Answers the server gives once and will keep giving; retrying them is noise. */
export const adminRetry = (failureCount, error) => {
  const status = error?.response?.status;

  if (status === 401 || status === 403 || status === 404) return false;

  // 429 is a rate limit: backing off once is reasonable, hammering is not.
  if (status === 429) return failureCount < 1;

  return failureCount < 2;
};

export default function useAdminAuditLogs({ filters, enabled = true }) {
  return useQuery({
    queryKey: adminAuditListKey(filters),
    queryFn: () => getAdminAuditLogs(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}
