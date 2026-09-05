import { createContext, useContext } from "react";

export const AdminAdsContext = createContext(null);

export default function useAdminAdsContext() {
  const context = useContext(AdminAdsContext);

  if (!context) {
    throw new Error("useAdminAdsContext must be used inside AdminAdsProvider");
  }

  return context;
}
