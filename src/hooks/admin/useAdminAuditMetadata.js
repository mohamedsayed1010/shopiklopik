import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAdminAuditMetadata } from "../../api/admin/auditLogs/adminAuditLogsEndpoints";
import { adminAuditMetadataKey } from "./adminAuditLogsKeys";
import { adminRetry } from "./useAdminAuditLogs";

export default function useAdminAuditMetadata({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminAuditMetadataKey(),
    queryFn: getAdminAuditMetadata,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: adminRetry,
  });

  const data = query.data?.data;

  const actions = useMemo(() => data?.actions ?? [], [data]);

  const targetTypes = useMemo(() => data?.targetTypes ?? [], [data]);

  const admins = useMemo(() => data?.admins ?? [], [data]);

  return { metadataQuery: query, actions, targetTypes, admins };
}
