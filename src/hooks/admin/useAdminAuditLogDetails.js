import { useQuery } from "@tanstack/react-query";

import { getAdminAuditLogDetails } from "../../api/admin/auditLogs/adminAuditLogsEndpoints";
import { adminAuditDetailsKey } from "./adminAuditLogsKeys";
import { adminRetry } from "./useAdminAuditLogs";

export default function useAdminAuditLogDetails({ id, seed }) {
  return useQuery({
    queryKey: adminAuditDetailsKey(id),
    queryFn: () => getAdminAuditLogDetails(id),
    enabled: Boolean(id),
    initialData: seed ? { success: true, message: null, data: seed } : undefined,
    initialDataUpdatedAt: 0,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}
