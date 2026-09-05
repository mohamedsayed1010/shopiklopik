import { useCallback, useMemo, useState } from "react";

import {
  urlDate,
  urlNumber,
  urlOneOf,
  urlPositiveInt,
  urlText,
} from "../hooks/useUrlState";
import useAdminListUrlState from "../hooks/admin/useAdminListUrlState";

import { AdminUsersContext } from "../hooks/admin/useAdminUsersContext";
import { DEFAULT_PAGE_SIZE } from "../pages/Admin/Users/usersConstants";

const SEARCH_DEBOUNCE_MS = 400;

const FILTER_KEYS = ["status", "isAdmin", "fromDate", "toDate"];

const URL_STATE = {
  search: { defaultValue: "", parse: urlText },
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: DEFAULT_PAGE_SIZE, parse: urlPositiveInt },

  status: { defaultValue: "", parse: urlNumber },
  isAdmin: { defaultValue: "", parse: urlOneOf(["true", "false"]) },
  fromDate: { defaultValue: "", parse: urlDate },
  toDate: { defaultValue: "", parse: urlDate },
};

export function AdminUsersProvider({ children }) {
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

  /** The user whose detail sheet is open — the row, used for its header. */
  const [selectedUser, setSelectedUser] = useState(null);

  /** True while the status dialog is up, on top of the detail sheet. */
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const openUser = useCallback((user) => setSelectedUser(user ?? null), []);

  const closeUser = useCallback(() => {
    setSelectedUser(null);

    setIsStatusOpen(false);
  }, []);

  const openStatusDialog = useCallback(() => setIsStatusOpen(true), []);

  const closeStatusDialog = useCallback(() => setIsStatusOpen(false), []);

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: filters.status === "" ? undefined : Number(filters.status),
      isAdmin: filters.isAdmin === "" ? undefined : filters.isAdmin === "true",
      fromDate: filters.fromDate ? `${filters.fromDate}T00:00:00` : undefined,
      toDate: filters.toDate ? `${filters.toDate}T23:59:59` : undefined,
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

      selectedUser,
      openUser,
      closeUser,

      isStatusOpen,
      openStatusDialog,
      closeStatusDialog,

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
      selectedUser,
      openUser,
      closeUser,
      isStatusOpen,
      openStatusDialog,
      closeStatusDialog,
      queryFilters,
    ]
  );

  return (
    <AdminUsersContext.Provider value={value}>
      {children}
    </AdminUsersContext.Provider>
  );
}

export default AdminUsersProvider;
