import { createContext, useContext } from "react";

export const AdminBannersContext = createContext(null);

export default function useAdminBannersContext() {
  const context = useContext(AdminBannersContext);

  if (!context) {
    throw new Error(
      "useAdminBannersContext must be used inside AdminBannersProvider"
    );
  }

  return context;
}
