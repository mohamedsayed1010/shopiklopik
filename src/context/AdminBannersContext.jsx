import { useCallback, useMemo, useState } from "react";

import {
  urlDate,
  urlNumber,
  urlOneOf,
  urlPositiveInt,
  urlText,
  useUrlDraftMap,
} from "../hooks/useUrlState";
import useAdminListUrlState from "../hooks/admin/useAdminListUrlState";

import { AdminBannersContext } from "../hooks/admin/useAdminBannersContext";
import { useAdminBannerStatuses } from "../hooks/admin/useAdminBannerRequests";
import { resolveBannerStatus } from "../utils/bannerModel";
import {
  BANNER_TABS,
  DEFAULT_PAGE_SIZE,
  EMPTY_BANNER_FILTERS,
  SEARCH_DEBOUNCE_MS,
} from "../pages/Admin/Banners/bannersConstants";

const FILTER_KEYS = Object.keys(EMPTY_BANNER_FILTERS);

/** The one free-text filter; it settles before it reaches the address. */
const TEXT_KEYS = ["userId"];

const URL_STATE = {
  tab: {
    defaultValue: BANNER_TABS[0].key,
    parse: urlOneOf(BANNER_TABS.map((item) => item.key)),
  },
  search: { defaultValue: "", parse: urlText },
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: DEFAULT_PAGE_SIZE, parse: urlPositiveInt },

  status: { defaultValue: "", parse: urlText },
  paymentStatus: { defaultValue: "", parse: urlNumber },
  location: { defaultValue: "", parse: urlNumber },
  categoryId: { defaultValue: "", parse: urlNumber },
  subCategoryId: { defaultValue: "", parse: urlNumber },
  userId: { defaultValue: "", parse: urlText },
  fromDate: { defaultValue: "", parse: urlDate },
  toDate: { defaultValue: "", parse: urlDate },
};

/* A category owns its sub-category: changing it leaves the old one dangling
   and narrowing to nothing. */
function cascade(name) {
  return name === "categoryId" ? { subCategoryId: "" } : null;
}

export function AdminBannersProvider({ children }) {
  const {
    values,
    setValues,
    search,
    setSearch,
    debouncedSearch,
    filters: committedFilters,
    setFilter: commitFilter,
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
    cascade,
  });

  const tab = values.tab;

  const setTab = useCallback(
    (key) => setValues({ tab: key, page: 1 }, { replace: false }),
    [setValues]
  );

  const committedText = useMemo(
    () =>
      Object.fromEntries(TEXT_KEYS.map((key) => [key, committedFilters[key]])),
    [committedFilters]
  );

  const commitText = useCallback(
    (patch) => setValues({ ...patch, page: 1 }),
    [setValues]
  );

  const [textDrafts, setTextDraft] = useUrlDraftMap(
    committedText,
    commitText,
    SEARCH_DEBOUNCE_MS
  );

  const filters = useMemo(
    () => ({ ...committedFilters, ...textDrafts }),
    [committedFilters, textDrafts]
  );

  const setFilter = useCallback(
    (name, value) =>
      TEXT_KEYS.includes(name)
        ? setTextDraft(name, value)
        : commitFilter(name, value),
    [setTextDraft, commitFilter]
  );

  /** The settled user id, which is what the request may use. */
  const debouncedUserId = committedText.userId;

  /** The id whose detail sheet is open. */
  const [selectedId, setSelectedId] = useState(null);

  const openRequest = useCallback((id) => setSelectedId(id ?? null), []);

  const closeRequest = useCallback(() => setSelectedId(null), []);

  const { statuses, statusesQuery } = useAdminBannerStatuses();

  const statusFilter = useMemo(() => {
    if (filters.status === "") {
      return { state: "none", id: undefined, status: null };
    }

    if (statusesQuery.isPending) {
      return { state: "pending", id: undefined, status: null };
    }

    const match = resolveBannerStatus(statuses, filters.status);

    return match
      ? { state: "resolved", id: match.id, status: match }
      : { state: "unresolved", id: undefined, status: null };
  }, [filters.status, statuses, statusesQuery.isPending]);

  /* The list is only asked for once the status in the address means something.
     A request sent while the vocabulary is loading, or with an unresolvable
     status silently dropped, would answer a different question. */
  const filtersReady =
    statusFilter.state !== "pending" && statusFilter.state !== "unresolved";

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter.id,
      paymentStatus:
        filters.paymentStatus === "" ? undefined : Number(filters.paymentStatus),
      location: filters.location === "" ? undefined : Number(filters.location),
      categoryId:
        filters.categoryId === "" ? undefined : Number(filters.categoryId),
      subCategoryId:
        filters.subCategoryId === "" ? undefined : Number(filters.subCategoryId),
      userId: debouncedUserId || undefined,
      fromDate: filters.fromDate ? `${filters.fromDate}T00:00:00` : undefined,
      toDate: filters.toDate ? `${filters.toDate}T23:59:59` : undefined,
      pageIndex,
      pageSize,
    }),
    [
      debouncedSearch,
      debouncedUserId,
      statusFilter.id,
      filters.paymentStatus,
      filters.location,
      filters.categoryId,
      filters.subCategoryId,
      filters.fromDate,
      filters.toDate,
      pageIndex,
      pageSize,
    ]
  );

  const value = useMemo(
    () => ({
      tab,
      setTab,

      search,
      setSearch,

      filters,
      setFilter,
      resetFilters,
      hasActiveFilters,

      statuses,
      statusesQuery,
      statusFilter,
      filtersReady,

      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,

      selectedId,
      openRequest,
      closeRequest,

      queryFilters,
    }),
    [
      tab,
      setTab,
      search,
      setSearch,
      filters,
      setFilter,
      resetFilters,
      hasActiveFilters,
      statuses,
      statusesQuery,
      statusFilter,
      filtersReady,
      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,
      selectedId,
      openRequest,
      closeRequest,
      queryFilters,
    ]
  );

  return (
    <AdminBannersContext.Provider value={value}>
      {children}
    </AdminBannersContext.Provider>
  );
}

export default AdminBannersProvider;
