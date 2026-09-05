import { useCallback, useMemo } from "react";

import useUrlState, { useUrlDraft } from "../useUrlState";

export default function useAdminListUrlState({
  schema,
  filterKeys,
  searchDebounceMs = 400,
  cascade = null,
}) {
  const { values, setValues, reset } = useUrlState(schema);

  const pageIndex = values.page;

  const pageSize = values.pageSize;

  /* The committed search: what the address holds, and therefore what the query
     key uses. The box keeps its own draft so typing stays instant. */
  const debouncedSearch = values.search ?? "";

  const commitSearch = useCallback(
    (value) => setValues({ search: value, page: 1 }),
    [setValues]
  );

  const [search, setSearch] = useUrlDraft(
    debouncedSearch,
    commitSearch,
    searchDebounceMs
  );

  const filters = useMemo(
    () =>
      Object.fromEntries(
        filterKeys.map((key) => [
          key,
          values[key] === "" || values[key] === undefined
            ? ""
            : String(values[key]),
        ])
      ),
    [values, filterKeys]
  );

  const setPageIndex = useCallback(
    (value) => setValues({ page: value }),
    [setValues]
  );

  const setPageSize = useCallback(
    (value) => setValues({ pageSize: value, page: 1 }),
    [setValues]
  );

  const setFilter = useCallback(
    (name, value) => {
      const patch = { [name]: value, page: 1, ...(cascade?.(name, value) ?? {}) };

      setValues(patch);
    },
    [setValues, cascade]
  );

  /* Clearing drops every key this page owns and keeps what is not a filter —
     the tab being looked at and how many rows fit on a page. */
  const resetFilters = useCallback(
    () => reset({ tab: values.tab, pageSize }),
    [reset, values.tab, pageSize]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(String(debouncedSearch).trim()) ||
      filterKeys.some((key) => filters[key] !== ""),
    [debouncedSearch, filters, filterKeys]
  );

  return {
    values,
    setValues,
    reset,

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
  };
}
