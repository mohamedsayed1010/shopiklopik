import { useCallback, useMemo, useState } from "react";

import { urlOneOf, urlPositiveInt, urlText } from "../hooks/useUrlState";
import useAdminListUrlState from "../hooks/admin/useAdminListUrlState";

import { AdminAccountsContext } from "../hooks/admin/useAdminAccountsContext";
import { DEFAULT_PAGE_SIZE } from "../pages/Admin/Accounts/accountsConstants";

const SEARCH_DEBOUNCE_MS = 400;

const FILTER_KEYS = ["isActive"];

/** The page, in the address bar — see `useAdminListUrlState`. */
const URL_STATE = {
  search: { defaultValue: "", parse: urlText },
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: DEFAULT_PAGE_SIZE, parse: urlPositiveInt },

  // A boolean tri-state: true, false, or absent for "either".
  isActive: { defaultValue: "", parse: urlOneOf(["true", "false"]) },
};

export function AdminAccountsProvider({ children }) {
  const {
    search,
    setSearch,
    debouncedSearch,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
  } = useAdminListUrlState({
    schema: URL_STATE,
    filterKeys: FILTER_KEYS,
    searchDebounceMs: SEARCH_DEBOUNCE_MS,
  });

  /** The account whose detail sheet is open — the row, used for its header. */
  const [selectedAccount, setSelectedAccount] = useState(null);

  /** Which dialog is stacked on top of the sheet, if any. */
  const [dialog, setDialog] = useState(null);

  const openAccount = useCallback(
    (account) => setSelectedAccount(account ?? null),
    []
  );

  const closeAccount = useCallback(() => {
    setSelectedAccount(null);

    setDialog(null);
  }, []);

  const openStatusDialog = useCallback(() => setDialog("status"), []);

  const openDeleteDialog = useCallback(() => setDialog("delete"), []);

  const closeDialog = useCallback(() => setDialog(null), []);

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      isActive:
        filters.isActive === "" ? undefined : filters.isActive === "true",
      pageIndex,
      pageSize,
    }),
    [debouncedSearch, filters, pageIndex, pageSize]
  );

  const value = useMemo(
    () => ({
      search,
      setSearch,
      debouncedSearch,

      filters,
      setFilter,
      resetFilters,
      hasActiveFilters,

      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,

      selectedAccount,
      openAccount,
      closeAccount,

      dialog,
      openStatusDialog,
      openDeleteDialog,
      closeDialog,

      queryFilters,
    }),
    [
      search,
      setSearch,
      debouncedSearch,
      filters,
      setFilter,
      resetFilters,
      hasActiveFilters,
      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,
      selectedAccount,
      openAccount,
      closeAccount,
      dialog,
      openStatusDialog,
      openDeleteDialog,
      closeDialog,
      queryFilters,
    ]
  );

  return (
    <AdminAccountsContext.Provider value={value}>
      {children}
    </AdminAccountsContext.Provider>
  );
}

export default AdminAccountsProvider;
