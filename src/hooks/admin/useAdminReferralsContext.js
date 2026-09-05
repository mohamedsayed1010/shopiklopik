import { createContext, useContext } from "react";

export const AdminReferralsContext = createContext(null);

export default function useAdminReferralsContext() {
  const context = useContext(AdminReferralsContext);

  if (!context) {
    throw new Error(
      "useAdminReferralsContext must be used inside AdminReferralsProvider"
    );
  }

  return context;
}
