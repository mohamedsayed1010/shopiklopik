import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** Whole numbers only; anything else is rejected so it cannot reach a query. */
export function urlNumber(raw) {
  if (raw === null || raw.trim() === "") return undefined;

  const value = Number(raw);

  return Number.isFinite(value) ? value : undefined;
}

/** A positive integer — page numbers and page sizes. */
export function urlPositiveInt(raw) {
  const value = urlNumber(raw);

  return Number.isInteger(value) && value > 0 ? value : undefined;
}

/** Trimmed text, with blank treated as absent. */
export function urlText(raw) {
  const value = String(raw ?? "").trim();

  return value === "" ? undefined : value;
}

/** A `YYYY-MM-DD` day, which is what every date input here produces. */
export function urlDate(raw) {
  const value = urlText(raw);

  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export function urlEnum(map) {
  const byName = new Map(
    Object.entries(map).map(([name, value]) => [name.toLowerCase(), value])
  );

  const values = new Set(Object.values(map).map(String));

  return (raw) => {
    const text = urlText(raw);

    if (text === undefined) return undefined;

    const named = byName.get(text.toLowerCase());

    if (named !== undefined) return named;

    return values.has(text) ? Number(text) : undefined;
  };
}

/** One of a fixed list of strings (a tab key, a sort key). */
export function urlOneOf(allowed) {
  const set = new Set(allowed.map((item) => String(item).toLowerCase()));

  const canonical = new Map(
    allowed.map((item) => [String(item).toLowerCase(), item])
  );

  return (raw) => {
    const text = urlText(raw);

    if (text === undefined) return undefined;

    return set.has(text.toLowerCase()) ? canonical.get(text.toLowerCase()) : undefined;
  };
}

const identity = (raw) => (raw === null ? undefined : raw);

export function applyUrlPatch(params, descriptors, patch) {
  const next = new URLSearchParams(params);

  Object.entries(patch).forEach(([key, value]) => {
    const descriptor = descriptors[key];

    if (!descriptor) return;

    const param = descriptor.param ?? key;

    const serialize = descriptor.serialize ?? String;

    if (descriptor.multiple) {
      next.delete(param);

      const list = Array.isArray(value) ? value : [];

      list.forEach((item) => {
        if (item === undefined || item === null || item === "") return;

        next.append(param, serialize(item));
      });

      return;
    }

    const isDefault =
      value === descriptor.defaultValue ||
      value === undefined ||
      value === null ||
      value === "";

    // The default is the absence of the parameter, never `?key=`.
    if (isDefault) next.delete(param);
    else next.set(param, serialize(value));
  });

  return next;
}

/** Every key `descriptors` owns removed, then `overrides` written back. */
export function clearUrlKeys(params, descriptors, overrides = {}) {
  const next = new URLSearchParams(params);

  Object.entries(descriptors).forEach(([key, descriptor]) =>
    next.delete(descriptor.param ?? key)
  );

  return applyUrlPatch(next, descriptors, overrides);
}

export default function useUrlState(descriptors) {
  const [searchParams, setSearchParams] = useSearchParams();

  /** What the address bar currently says, defaults filled in. */
  const values = useMemo(() => {
    const state = {};

    Object.entries(descriptors).forEach(([key, descriptor]) => {
      const param = descriptor.param ?? key;

      const parse = descriptor.parse ?? identity;

      /* Repeated keys collapse into one array, each entry parsed on its own.
         An entry the parse rejects is dropped rather than poisoning the list. */
      if (descriptor.multiple) {
        state[key] = searchParams
          .getAll(param)
          .map((raw) => parse(raw))
          .filter((item) => item !== undefined);

        return;
      }

      const raw = searchParams.get(param);

      const parsed = raw === null ? undefined : parse(raw);

      state[key] = parsed === undefined ? descriptor.defaultValue : parsed;
    });

    return state;
  }, [searchParams, descriptors]);

  const setValues = useCallback(
    (patch, { replace = true } = {}) => {
      setSearchParams(
        (previous) => applyUrlPatch(previous, descriptors, patch),
        { replace }
      );
    },
    [setSearchParams, descriptors]
  );

  /** Drop every key this page owns, leaving any it does not alone. */
  const reset = useCallback(
    (overrides = {}) =>
      setSearchParams((previous) => clearUrlKeys(previous, descriptors, overrides), {
        replace: true,
      }),
    [setSearchParams, descriptors]
  );

  return { values, setValues, reset };
}

export function useUrlDraft(committed, commit, delay = 400) {
  const [draft, setDraft] = useState(committed);

  /* The last committed value this hook has reconciled against. Plain state
     rather than a ref: comparing it during render is how React documents
     adjusting state when an input changes, and a ref may not be read there. */
  const [seen, setSeen] = useState(committed);

  const timer = useRef(null);

  if (seen !== committed) {
    setSeen(committed);

    setDraft(committed);
  }

  const update = useCallback(
    (value) => {
      setDraft(value);

      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        timer.current = null;

        commit(value);
      }, delay);
    },
    [commit, delay]
  );

  return [draft, update];
}

export function useUrlDraftMap(committed, commit, delay = 400) {
  const [drafts, setDrafts] = useState(committed);

  const [seen, setSeen] = useState(committed);

  const timer = useRef(null);

  const pending = useRef({});

  const changed = Object.keys(committed).some(
    (key) => committed[key] !== seen[key]
  );

  if (changed) {
    setSeen(committed);

    setDrafts((previous) => ({ ...previous, ...committed }));
  }

  const update = useCallback(
    (name, value) => {
      setDrafts((previous) => ({ ...previous, [name]: value }));

      pending.current = { ...pending.current, [name]: value };

      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        timer.current = null;

        const patch = pending.current;

        pending.current = {};

        commit(patch);
      }, delay);
    },
    [commit, delay]
  );

  return [drafts, update];
}
