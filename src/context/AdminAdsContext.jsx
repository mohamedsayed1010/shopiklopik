import { useCallback, useMemo, useState } from "react";

import { AdminAdsContext } from "../hooks/admin/useAdminAdsContext";
import {
  urlDate,
  urlEnum,
  urlNumber,
  urlOneOf,
  urlPositiveInt,
  urlText,
} from "../hooks/useUrlState";
import useAdminListUrlState from "../hooks/admin/useAdminListUrlState";
import {
  ADMIN_ADS_TABS,
  DEFAULT_PAGE_SIZE,
  LISTING_STATUS,
  MODERATION_STATUS,
} from "../pages/Admin/Ads/adminAdsConstants";

const SEARCH_DEBOUNCE_MS = 400;

const FILTER_KEYS = [
  "categoryId",
  "subCategoryId",
  "type",
  "moderationStatus",
  "status",
  "fromDate",
  "toDate",
  "ownerId",
];

const URL_STATE = {
  tab: {
    defaultValue: ADMIN_ADS_TABS[0].key,
    parse: urlOneOf(ADMIN_ADS_TABS.map((tab) => tab.key)),
  },
  search: { defaultValue: "", parse: urlText },
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: DEFAULT_PAGE_SIZE, parse: urlPositiveInt },

  categoryId: { defaultValue: "", parse: urlNumber },
  subCategoryId: { defaultValue: "", parse: urlNumber },
  type: { defaultValue: "", parse: urlNumber },
  moderationStatus: { defaultValue: "", parse: urlEnum(MODERATION_STATUS) },
  status: { defaultValue: "", parse: urlEnum(LISTING_STATUS) },
  fromDate: { defaultValue: "", parse: urlDate },
  toDate: { defaultValue: "", parse: urlDate },
  ownerId: { defaultValue: "", parse: urlText },
};

/* A category owns its sub-category, and both own the module. Changing a parent
   clears what it invalidates rather than leaving a combination that matches
   nothing. */
function cascade(name) {
  if (name === "categoryId") return { subCategoryId: "", type: "" };

  if (name === "subCategoryId") return { type: "" };

  return null;
}

export function AdminAdsProvider({ children }) {
  const {
    values,
    setValues,
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
    cascade,
  });

  const tabKey = values.tab;

  /** The ad whose details sheet is open: `{ type, id, title }` or null. */
  const [selectedAd, setSelectedAd] = useState(null);

  /** Which dialog is up: "approve" | "reject" | "suspend" | "delete" | null. */
  const [action, setAction] = useState(null);

  /* Moving to another tab is a place the reader can go back from, so it is the
     one change here that pushes a history entry rather than replacing. */
  const setTabKey = useCallback(
    (key) => setValues({ tab: key, page: 1 }, { replace: false }),
    [setValues]
  );

  const activeTab = useMemo(
    () => ADMIN_ADS_TABS.find((tab) => tab.key === tabKey) ?? ADMIN_ADS_TABS[0],
    [tabKey]
  );

  const openDetails = useCallback((ad) => {
    setSelectedAd(ad ? { type: ad.typeId, id: ad.id, title: ad.title } : null);
  }, []);

  const closeDetails = useCallback(() => setSelectedAd(null), []);

  const openAction = useCallback((name, ad) => {
    if (ad) setSelectedAd({ type: ad.typeId, id: ad.id, title: ad.title });

    setAction(name);
  }, []);

  const closeAction = useCallback(() => setAction(null), []);

  const queryFilters = useMemo(() => {
    const numeric = (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value);

    return {
      search: debouncedSearch || undefined,
      categoryId: numeric(filters.categoryId),
      subCategoryId: numeric(filters.subCategoryId),
      type: numeric(filters.type),
      moderationStatus: numeric(filters.moderationStatus),
      status: numeric(filters.status),
      // <input type="date"> yields YYYY-MM-DD, which the API accepts as a
      // date-time. Passed through rather than reformatted.
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      ownerId: filters.ownerId.trim() || undefined,
      ...activeTab.filters,
      pageIndex,
      pageSize,
    };
  }, [debouncedSearch, filters, activeTab, pageIndex, pageSize]);

  const value = useMemo(
    () => ({
      tabKey,
      setTabKey,
      activeTab,

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

      selectedAd,
      openDetails,
      closeDetails,

      action,
      openAction,
      closeAction,

      queryFilters,
    }),
    [
      tabKey,
      setTabKey,
      activeTab,
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
      selectedAd,
      openDetails,
      closeDetails,
      action,
      openAction,
      closeAction,
      queryFilters,
    ]
  );

  return (
    <AdminAdsContext.Provider value={value}>{children}</AdminAdsContext.Provider>
  );
}

export default AdminAdsProvider;
