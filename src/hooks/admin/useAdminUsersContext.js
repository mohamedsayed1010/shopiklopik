import { createContext, useContext } from "react";

export const AdminUsersContext = createContext(null);

export default function useAdminUsersContext() {
  const context = useContext(AdminUsersContext);

  if (!context) {
    throw new Error("useAdminUsersContext must be used inside AdminUsersProvider");
  }

  return context;
}
