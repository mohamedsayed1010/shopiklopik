import { createContext, useContext } from "react";

export const AdminAuditLogsContext = createContext(null);

export default function useAdminAuditLogsContext() {
  const context = useContext(AdminAuditLogsContext);

  if (!context) {
    throw new Error(
      "useAdminAuditLogsContext must be used inside AdminAuditLogsProvider"
    );
  }

  return context;
}
