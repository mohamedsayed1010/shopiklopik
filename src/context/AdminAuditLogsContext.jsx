import { useCallback, useMemo, useState } from "react";

import {
  urlDate,
  urlNumber,
  urlOneOf,
  urlPositiveInt,
  urlText,
} from "../hooks/useUrlState";
import useAdminListUrlState from "../hooks/admin/useAdminListUrlState";

import { AdminAuditLogsContext } from "../hooks/admin/useAdminAuditLogsContext";
import {
  AUDIT_SORT_OPTIONS,
  DEFAULT_AUDIT_SORT,
  DEFAULT_PAGE_SIZE,
} from "../pages/Admin/AuditLogs/auditLogsConstants";

const SEARCH_DEBOUNCE_MS = 400;

const FILTER_KEYS = [
  "adminUserId",
  "action",
  "targetType",
  "targetId",
  "dateFrom",
  "dateTo",
];

const URL_STATE = {
  search: { defaultValue: "", parse: urlText },
  sort: {
    defaultValue: DEFAULT_AUDIT_SORT,
    parse: urlOneOf(AUDIT_SORT_OPTIONS.map((option) => option.value)),
  },
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: DEFAULT_PAGE_SIZE, parse: urlPositiveInt },

  adminUserId: { defaultValue: "", parse: urlText },
  action: { defaultValue: "", parse: urlNumber },
  targetType: { defaultValue: "", parse: urlText },
  targetId: { defaultValue: "", parse: urlText },
  dateFrom: { defaultValue: "", parse: urlDate },
  dateTo: { defaultValue: "", parse: urlDate },
};

export function AdminAuditLogsProvider({ children }) {
  const {
    values,
    setValues,
    reset,
    search,
    setSearch,
    debouncedSearch,
    filters,
    setFilter,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
  } = useAdminListUrlState({
    schema: URL_STATE,
    filterKeys: FILTER_KEYS,
    searchDebounceMs: SEARCH_DEBOUNCE_MS,
  });

  const sort = values.sort;

  const setSort = useCallback(
    (value) => setValues({ sort: value, page: 1 }),
    [setValues]
  );

  /* Clearing puts the sort back to its default too — this page treats the
     order as part of what "clear" means, which is what it did before. */
  const resetFilters = useCallback(
    () => reset({ pageSize }),
    [reset, pageSize]
  );

  /** The row whose detail sheet is open — the full row, used to seed it. */
  const [selectedEntry, setSelectedEntry] = useState(null);

  const openEntry = useCallback((entry) => setSelectedEntry(entry ?? null), []);

  const closeEntry = useCallback(() => setSelectedEntry(null), []);

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      adminUserId: filters.adminUserId || undefined,
      action: filters.action === "" ? undefined : Number(filters.action),
      targetType: filters.targetType || undefined,
      targetId: filters.targetId.trim() || undefined,
      dateFrom: filters.dateFrom ? `${filters.dateFrom}T00:00:00` : undefined,
      dateTo: filters.dateTo ? `${filters.dateTo}T23:59:59` : undefined,
      sort,
      pageIndex,
      pageSize,
    }),
    [debouncedSearch, filters, sort, pageIndex, pageSize]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(search.trim()) ||
      Object.values(filters).some((value) => value !== "") ||
      sort !== DEFAULT_AUDIT_SORT,
    [search, filters, sort]
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

      sort,
      setSort,

      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,

      selectedEntry,
      openEntry,
      closeEntry,

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
      sort,
      setSort,
      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,
      selectedEntry,
      openEntry,
      closeEntry,
      queryFilters,
    ]
  );

  return (
    <AdminAuditLogsContext.Provider value={value}>
      {children}
    </AdminAuditLogsContext.Provider>
  );
}

export default AdminAuditLogsProvider;
