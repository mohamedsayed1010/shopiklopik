import { useCallback, useMemo } from "react";

import {
  urlDate,
  urlNumber,
  urlOneOf,
  urlText,
  urlPositiveInt,
  useUrlDraftMap,
} from "../hooks/useUrlState";
import useAdminListUrlState from "../hooks/admin/useAdminListUrlState";

import { AdminReferralsContext } from "../hooks/admin/useAdminReferralsContext";
import { DEFAULT_PAGE_SIZE } from "../pages/Referrals/referralsConstants";

const TEXT_DEBOUNCE_MS = 400;

const FILTER_KEYS = [
  "referrerUserId",
  "referredUserId",
  "referralCode",
  "status",
  "fromDate",
  "toDate",
];

/** The three free-text filters debounce together; the rest apply at once. */
const TEXT_KEYS = ["referrerUserId", "referredUserId", "referralCode"];

const URL_STATE = {
  /* Which of the two lists this route is showing. Preserved by
     `resetFilters`, which keeps `tab` and `pageSize` by design. */
  tab: {
    defaultValue: "referrals",
    parse: urlOneOf(["referrals", "referrers"]),
  },

  search: { defaultValue: "", parse: urlText },
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: DEFAULT_PAGE_SIZE, parse: urlPositiveInt },

  referrerUserId: { defaultValue: "", parse: urlText },
  referredUserId: { defaultValue: "", parse: urlText },
  referralCode: { defaultValue: "", parse: urlText },
  status: { defaultValue: "", parse: urlNumber },
  fromDate: { defaultValue: "", parse: urlDate },
  toDate: { defaultValue: "", parse: urlDate },
};

export function AdminReferralsProvider({ children }) {
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
    searchDebounceMs: TEXT_DEBOUNCE_MS,
  });

  /* The three id/code boxes are typed into, so they settle before they reach
     the address — the dropdown and the dates commit on the spot. */
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
    TEXT_DEBOUNCE_MS
  );

  /* What the inputs show: the settled values, with the three text boxes
     showing whatever is being typed into them right now. */
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

  /** The settled text, which is what the request may use. */
  const debouncedText = committedText;

  const queryFilters = useMemo(() => {
    const text = (key) =>
      TEXT_KEYS.includes(key)
        ? debouncedText[key]?.trim() || undefined
        : filters[key] || undefined;

    return {
      search: debouncedSearch || undefined,
      referrerUserId: text("referrerUserId"),
      referredUserId: text("referredUserId"),
      referralCode: text("referralCode"),
      status: filters.status === "" ? undefined : Number(filters.status),
      fromDate: filters.fromDate ? `${filters.fromDate}T00:00:00` : undefined,
      toDate: filters.toDate ? `${filters.toDate}T23:59:59` : undefined,
      pageIndex,
      pageSize,
    };
  }, [debouncedSearch, debouncedText, filters, pageIndex, pageSize]);

  /* Switching list is a navigation the reader may want to go back from, so it
     is pushed rather than replaced — unlike a filter keystroke. */
  const setTab = useCallback(
    (next) => setValues({ tab: next }, { replace: false }),
    [setValues]
  );

  const value = useMemo(
    () => ({
      tab: values.tab,
      setTab,
      search,
      setSearch,
      filters,
      setFilter,
      resetFilters,
      hasActiveFilters,
      queryFilters,
      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,
    }),
    [
      values.tab,
      setTab,
      search,
      setSearch,
      filters,
      setFilter,
      resetFilters,
      hasActiveFilters,
      queryFilters,
      pageIndex,
      setPageIndex,
      pageSize,
      setPageSize,
    ]
  );

  return (
    <AdminReferralsContext.Provider value={value}>
      {children}
    </AdminReferralsContext.Provider>
  );
}
