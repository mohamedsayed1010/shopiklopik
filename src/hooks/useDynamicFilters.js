import { useCallback, useMemo, useState } from "react";

import useUrlState, {
  urlNumber,
  urlPositiveInt,
  urlText,
} from "./useUrlState";

/** A stable identity, so a multi-valued default never re-keys a memo. */
const EMPTY_LIST = [];

/** Empty in every sense the API treats as "not sent". */
function isBlank(value) {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

const PAGINATION_KEYS = ["page", "pageIndex", "pageSize"];

function parserFor(type) {
  switch (String(type ?? "").toLowerCase()) {
    case "bool":
    case "boolean":
      return (raw) => {
        const value = String(raw ?? "").trim().toLowerCase();

        if (value === "true") return true;

        if (value === "false") return false;

        // Neither — the filter was never legitimately set.
        return undefined;
      };

    case "int":
    case "decimal":
    case "double":
    case "float":
      return urlNumber;

    default:
      return urlText;
  }
}

export default function useDynamicFilters(
  config = null,
  {
    searchKey = null,
    initialPageSize = 12,
    initialFilters = {},
    resetKey = null,
  } = {}
) {
  const pinned = useMemo(() => {
    const base = { ...(config?.list?.query ?? {}) };

    (config?.list?.queryParameters ?? []).forEach((parameter) => {
      if (parameter?.required !== true) return;

      if (!isBlank(base[parameter.name])) return;

      if (isBlank(parameter.defaultValue)) return;

      base[parameter.name] = parameter.defaultValue;
    });

    return base;
  }, [config]);

  const schema = useMemo(() => {
    const next = {
      page: { defaultValue: 1, parse: urlPositiveInt },
      pageSize: { defaultValue: initialPageSize, parse: urlPositiveInt },
    };

    (config?.list?.queryParameters ?? []).forEach((parameter) => {
      const name = parameter?.name;

      if (!name || PAGINATION_KEYS.includes(name)) return;

      // Pinned parameters are the list's identity, never a filter on it.
      if (Object.prototype.hasOwnProperty.call(pinned, name)) return;

      /* `multiple` is the config's own flag — `featureIds` on ملاكي declares
         it — and a multi-valued filter round-trips as repeated keys, which is
         the form the endpoint binds. Its default is an empty list, not "". */
      const multiple = parameter?.multiple === true;

      next[name] = {
        multiple,
        defaultValue: initialFilters?.[name] ?? (multiple ? EMPTY_LIST : ""),
        parse: parserFor(parameter?.type),
      };
    });

    return next;
    // `initialFilters` is a literal at every call site; keyed by its contents.
  }, [config, pinned, initialPageSize, initialFilters]);

  const { values, setValues, reset } = useUrlState(schema);

  const pageIndex = values.page;

  const pageSize = values.pageSize;

  /** The filters actually set, in the shape the panel and the request expect. */
  const filters = useMemo(() => {
    const next = {};

    Object.keys(schema).forEach((key) => {
      if (PAGINATION_KEYS.includes(key)) return;

      if (!isBlank(values[key])) next[key] = values[key];
    });

    return next;
  }, [schema, values]);

  const [search, setSearch] = useState("");

  /* Start over when the list itself changes. Adjusting state during render is
     React's own recipe for this — it re-renders before committing anything, so
     no request is ever sent with the previous section's leftovers. */
  const [currentKey, setCurrentKey] = useState(resetKey);

  if (resetKey !== currentKey) {
    setCurrentKey(resetKey);
    setSearch("");
  }

  const isPinned = useCallback(
    (name) => Object.prototype.hasOwnProperty.call(pinned, name),
    [pinned]
  );

  /** A name this list actually offers — anything else is refused. */
  const isKnown = useCallback(
    (name) =>
      Object.prototype.hasOwnProperty.call(schema, name) &&
      !PAGINATION_KEYS.includes(name),
    [schema]
  );

  /* Narrowing returns to page 1: staying on page 7 of a shorter result set
     shows an empty list that reads as "no results". */
  const setFilter = useCallback(
    (name, value) => {
      if (isPinned(name) || !isKnown(name)) return;

      setValues({ [name]: value, page: 1 });
    },
    [isPinned, isKnown, setValues]
  );

  const setMultipleFilters = useCallback(
    (next) => {
      const patch = { page: 1 };

      Object.entries(next ?? {}).forEach(([key, value]) => {
        if (isPinned(key) || !isKnown(key)) return;

        patch[key] = value;
      });

      // One navigation for the whole set, not one per field.
      setValues(patch);
    },
    [isPinned, isKnown, setValues]
  );

  const removeFilter = useCallback(
    (name) => setFilter(name, ""),
    [setFilter]
  );

  const clearSearch = useCallback(() => {
    setSearch("");

    setValues({ page: 1 });
  }, [setValues]);

  /* Clearing drops every filter and returns to page 1, and keeps how many rows
     the reader chose to see — that is a preference, not a filter. */
  const resetFilters = useCallback(() => {
    setSearch("");

    reset({ pageSize });
  }, [reset, pageSize]);

  const changeSearch = useCallback(
    (value) => {
      setSearch(value);

      setValues({ page: 1 });
    },
    [setValues]
  );

  const changePage = useCallback(
    (page) => setValues({ page }),
    [setValues]
  );

  const changePageSize = useCallback(
    (size) => setValues({ pageSize: size, page: 1 }),
    [setValues]
  );

  /** Replace the whole filter set — kept for the existing hook contract. */
  const setFilters = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? next(filters) : next;

      const patch = { page: 1 };

      // Everything this list offers is cleared, then the new set applied.
      Object.keys(schema).forEach((key) => {
        if (!PAGINATION_KEYS.includes(key)) patch[key] = "";
      });

      Object.entries(resolved ?? {}).forEach(([key, value]) => {
        if (isPinned(key) || !isKnown(key)) return;

        patch[key] = value;
      });

      setValues(patch);
    },
    [filters, schema, isPinned, isKnown, setValues]
  );

  const query = useMemo(() => {
    const params = { ...filters, pageIndex, pageSize };

    if (searchKey && search.trim()) {
      params[searchKey] = search.trim();
    }

    Object.keys(params).forEach((key) => {
      if (isBlank(params[key])) delete params[key];
    });

    /* Last, and deliberately: whatever the reader has typed or cleared, the
       request still carries what the backend said this list is. */
    return { ...params, ...pinned };
  }, [filters, search, searchKey, pageIndex, pageSize, pinned]);

  const hasFilters = useMemo(
    () => Object.keys(filters).length > 0 || search.trim() !== "",
    [filters, search]
  );

  return {
    filters,

    /** What the config fixed — for the panel, so it does not offer them. */
    pinned,

    search,

    pageIndex,

    pageSize,

    query,

    hasFilters,

    setFilter,

    setMultipleFilters,

    removeFilter,

    resetFilters,

    clearSearch,

    changeSearch,

    changePage,

    changePageSize,

    setFilters,
  };
}
