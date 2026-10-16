import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getCategoriesTree } from "../api/categories/categories";
import { getReadConfig } from "../api/categories/lookups";
import { getDynamicData } from "../api/products/products";
import { buildListingCard } from "../utils/listingModel";
import { foldText } from "../utils/search";

/* There is no public endpoint that searches every module at once — the only
   cross-module search is the admin one (`/api/v2/admin/ads`). What every
   module's list *does* publish, in its read-config, is a `search` parameter.
   So an ad search is one request per searchable list, read a few at a time:
   the API sits behind a per-IP rate limiter, and a burst of fifty would trip
   it for the whole page. */
const CONCURRENCY = 4;

const PER_MODULE = 6;

/* This many failures before a single answer means the API is unreachable,
   not that a few lists are broken — the rest are not worth waiting for. */
const GIVE_UP_AFTER = CONCURRENCY * 2;

const TREE_QUERY = {
  queryKey: ["categories-tree"],
  queryFn: getCategoriesTree,
  staleTime: 1000 * 60 * 10,
};

const READ_CONFIG_STALE = 1000 * 60 * 30;

const SEARCH_STALE = 1000 * 60;

const IDLE = {
  status: "idle",
  cards: [],
  searched: 0,
  pending: 0,
  failed: 0,
};

async function eachLimited(items, limit, worker, isCancelled) {
  let next = 0;

  const run = async () => {
    while (next < items.length && !isCancelled()) {
      const item = items[next];

      next += 1;

      await worker(item);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}

/** The query a list must always carry — the same rule `useDynamicFilters`
    applies: the config's fixed `list.query`, plus the default of any required
    parameter it left unset. */
function pinnedQuery(list) {
  const base = { ...(list?.query ?? {}) };

  (list?.queryParameters ?? []).forEach((parameter) => {
    if (parameter?.required !== true) return;

    const current = base[parameter.name];

    if (current !== undefined && current !== null && current !== "") return;

    if (parameter.defaultValue === undefined || parameter.defaultValue === null) {
      return;
    }

    base[parameter.name] = parameter.defaultValue;
  });

  return base;
}

/** One request per distinct list. `/api/ads` serves all four car
    sub-categories with the same query, so it is searched once, and its rows
    then route themselves by their own `categoryId`/`subCategoryId`. */
function searchTargets(entries) {
  const targets = new Map();

  entries.forEach(({ pair, config }) => {
    const list = config?.list;

    if (!list?.endpoint || String(list.method ?? "GET").toUpperCase() !== "GET") {
      return;
    }

    // A list that cannot be searched, or whose rows cannot be opened, is not asked.
    const searchable = (list.queryParameters ?? []).some(
      (parameter) => parameter?.name === "search"
    );

    if (!searchable || !config?.details?.endpoint) return;

    const query = pinnedQuery(list);

    const key = `${list.endpoint}?${JSON.stringify(
      Object.entries(query).sort(([a], [b]) => a.localeCompare(b))
    )}`;

    const existing = targets.get(key);

    if (existing) {
      existing.pairs.push(pair);

      return;
    }

    targets.set(key, { key, endpoint: list.endpoint, query, pairs: [pair] });
  });

  return [...targets.values()];
}

/** Does the term name this section? Folded the same way the section
    suggestions are, so "سياره" finds "سيارات" and "ملاكى" finds "ملاكي". */
function namesSection(target, needle) {
  return target.pairs.some((pair) =>
    foldText(`${pair.subCategoryName ?? ""} ${pair.categoryName ?? ""}`).includes(
      needle
    )
  );
}

/* Lower sorts first. */
const BY_TITLE = 0;
const BY_CONTENT = 1;
const BY_SECTION = 2;

/** Title matches first — that is what a reader means by "find" — then what
    the server matched elsewhere in the ad, then ads that are only here
    because their section carries the name; newest first in each. */
function rank(cards) {
  const time = (card) => {
    const value = card.createdAt ? new Date(card.createdAt).getTime() : NaN;

    return Number.isFinite(value) ? value : 0;
  };

  return [...cards].sort(
    (a, b) => a.matchedBy - b.matchedBy || time(b) - time(a)
  );
}

/**
 * Searches advertisement content across every module whose list declares a
 * `search` parameter. `term` is what was *submitted*, not what is being typed:
 * nothing is requested until the reader asks.
 */
export default function useAdSearch(term) {
  const queryClient = useQueryClient();

  const [attempt, setAttempt] = useState(0);

  const [result, setResult] = useState(null);

  const needle = String(term ?? "").trim();

  /* Which search a result answers. Anything older is never shown: a new
     term reads as "loading" from its very first render. */
  const searchKey = `${needle}\u0000${attempt}`;

  useEffect(() => {
    if (!needle) return undefined;

    let cancelled = false;

    const isCancelled = () => cancelled;

    const setState = (next) => setResult({ key: searchKey, ...next });

    (async () => {
      let tree;

      try {
        tree = (await queryClient.fetchQuery(TREE_QUERY))?.data ?? [];
      } catch {
        if (!cancelled) setState({ ...IDLE, status: "error" });

        return;
      }

      const names = new Map();

      const pairs = [];

      (Array.isArray(tree) ? tree : []).forEach((category) => {
        (category.subCategories ?? []).forEach((subCategory) => {
          const pair = {
            categoryId: category.id,
            subCategoryId: subCategory.id,
            categoryName: category.nameAr ?? category.name ?? null,
            subCategoryName: subCategory.nameAr ?? subCategory.name ?? null,
          };

          pairs.push(pair);

          names.set(`${pair.categoryId}:${pair.subCategoryId}`, pair);
        });
      });

      const entries = [];

      /* The same cache entries the list pages read — a reader who has browsed
         a section has already paid for its config. */
      await eachLimited(
        pairs,
        CONCURRENCY,
        async (pair) => {
          try {
            const response = await queryClient.fetchQuery({
              queryKey: ["read-config", pair.categoryId, pair.subCategoryId],
              queryFn: () => getReadConfig(pair.categoryId, pair.subCategoryId),
              staleTime: READ_CONFIG_STALE,
            });

            if (response?.data) entries.push({ pair, config: response.data });
          } catch {
            /* An inactive sub-category answers 404 — it has nothing to find. */
          }
        },
        isCancelled
      );

      if (cancelled) return;

      const targets = searchTargets(entries);

      if (targets.length === 0) {
        setState({ ...IDLE, status: "error" });

        return;
      }

      const folded = foldText(needle);

      /* Every list is searched for the term. The server's `search` matches an
         ad's own text but never the name of its section, so a list whose
         section the term names is also read as it stands — "سيارات" should
         find cars even when no car ad repeats the word. */
      const jobs = [
        ...targets.map((target) => ({ target, bySection: false })),
        ...targets
          .filter((target) => namesSection(target, folded))
          .map((target) => ({ target, bySection: true })),
      ];

      const found = new Map();

      let searched = 0;

      let failed = 0;

      const publish = (status) =>
        setState({
          status,
          cards: rank([...found.values()]),
          searched,
          pending: jobs.length - searched - failed,
          failed,
        });

      publish("loading");

      const unreachable = () => searched === 0 && failed >= GIVE_UP_AFTER;

      await eachLimited(
        jobs,
        CONCURRENCY,
        async ({ target, bySection }) => {
          const params = {
            ...target.query,
            ...(bySection ? {} : { search: needle }),
            pageIndex: 1,
            pageSize: PER_MODULE,
          };

          let response;

          try {
            response = await queryClient.fetchQuery({
              queryKey: ["ad-search", target.endpoint, params],
              queryFn: () => getDynamicData(target.endpoint, params),
              staleTime: SEARCH_STALE,
              retry: 1,
            });
          } catch {
            failed += 1;

            if (!cancelled) publish("loading");

            return;
          }

          if (cancelled) return;

          searched += 1;

          const data = response?.data ?? {};

          const items = Array.isArray(data.items) ? data.items : [];

          /* A list shared by several sub-categories cannot lend its rows one
             pair — the row's own ids decide, or the row is not offered. */
          const only = target.pairs.length === 1 ? target.pairs[0] : null;

          items.forEach((item) => {
            const card = buildListingCard(item, {
              key: target.endpoint,
              categoryId: only?.categoryId ?? null,
              subCategoryId: only?.subCategoryId ?? null,
            });

            if (!card?.href) return;

            const matchedBy = bySection
              ? BY_SECTION
              : card.hasTitle && foldText(card.title).includes(folded)
                ? BY_TITLE
                : BY_CONTENT;

            const previous = found.get(card.href);

            if (previous && previous.matchedBy <= matchedBy) return;

            const named = names.get(`${card.categoryId}:${card.subCategoryId}`);

            found.set(card.href, {
              ...card,
              matchedBy,
              category: named?.categoryName ?? card.category,
              subCategory: named?.subCategoryName ?? card.subCategory,
            });
          });

          publish("loading");
        },
        () => cancelled || unreachable()
      );

      if (cancelled) return;

      /* Only "nothing answered" is an error. Some lists failing still leaves
         real results, and the panel says the search was partial. */
      publish(searched === 0 ? "error" : "success");
    })();

    return () => {
      cancelled = true;
    };
  }, [needle, searchKey, queryClient]);

  let state = IDLE;

  if (needle) {
    state =
      result?.key === searchKey ? result : { ...IDLE, status: "loading" };
  }

  return {
    ...state,
    retry: () => setAttempt((value) => value + 1),
  };
}
