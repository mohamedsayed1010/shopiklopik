import { createContext, useContext } from "react";

export const AdminReportsContext = createContext(null);

export default function useAdminReportsContext() {
  const context = useContext(AdminReportsContext);

  if (!context) {
    throw new Error(
      "useAdminReportsContext must be used inside AdminReportsProvider"
    );
  }

  return context;
}
