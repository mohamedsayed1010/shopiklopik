import { createContext, useContext } from "react";

export const AdminAccountsContext = createContext(null);

export default function useAdminAccountsContext() {
  const context = useContext(AdminAccountsContext);

  if (!context) {
    throw new Error(
      "useAdminAccountsContext must be used inside AdminAccountsProvider"
    );
  }

  return context;
}
