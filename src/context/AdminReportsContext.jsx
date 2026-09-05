import { useCallback, useMemo, useState } from "react";

import { AdminReportsContext } from "../hooks/admin/useAdminReportsContext";
import { DEFAULT_PAGE_SIZE } from "../pages/Admin/Reports/reportsConstants";
import { urlNumber, urlPositiveInt } from "../hooks/useUrlState";
import useAdminListUrlState from "../hooks/admin/useAdminListUrlState";

const FILTER_KEYS = ["status", "reason", "type"];

const URL_STATE = {
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: DEFAULT_PAGE_SIZE, parse: urlPositiveInt },

  status: { defaultValue: "", parse: urlNumber },
  reason: { defaultValue: "", parse: urlNumber },
  type: { defaultValue: "", parse: urlNumber },
};

export function AdminReportsProvider({ children }) {
  const {
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
  } = useAdminListUrlState({ schema: URL_STATE, filterKeys: FILTER_KEYS });

  /** The report whose detail sheet is open — the row, used for its header. */
  const [selectedReport, setSelectedReport] = useState(null);

  /** "ignore" | "action" | "update" | null — one dialog at a time. */
  const [dialog, setDialog] = useState(null);

  const openReport = useCallback((report) => {
    setSelectedReport(report ?? null);
  }, []);

  const closeReport = useCallback(() => {
    setSelectedReport(null);

    setDialog(null);
  }, []);

  const openDialog = useCallback((name, report) => {
    if (report) setSelectedReport(report);

    setDialog(name);
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  const queryFilters = useMemo(
    () => ({
      status: filters.status === "" ? undefined : Number(filters.status),
      reason: filters.reason === "" ? undefined : Number(filters.reason),
      type: filters.type === "" ? undefined : Number(filters.type),
      pageIndex,
      pageSize,
    }),
    [filters, pageIndex, pageSize]
  );

  const value = useMemo(
    () => ({
      filters,
      setFilter,
      resetFilters,
      hasActiveFilters,

      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,

      selectedReport,
      openReport,
      closeReport,

      dialog,
      openDialog,
      closeDialog,

      queryFilters,
    }),
    [
      filters,
      setFilter,
      resetFilters,
      hasActiveFilters,
      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,
      selectedReport,
      openReport,
      closeReport,
      dialog,
      openDialog,
      closeDialog,
      queryFilters,
    ]
  );

  return (
    <AdminReportsContext.Provider value={value}>
      {children}
    </AdminReportsContext.Provider>
  );
}

export default AdminReportsProvider;
