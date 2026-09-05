import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { getCategoriesTree } from "../api/categories/categories";
import { getReadConfig } from "../api/categories/lookups";
import { getListingInteractionMetadata } from "../api/advertisements/interactions";

export function normalizeModule(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function endpointKey(value) {
  if (!value) return "";

  const path = String(value).split(/[?#]/)[0];

  const segments = path
    .split("/")
    .filter(Boolean)
    .filter(
      (segment) =>
        !segment.startsWith("{") && !UUID.test(segment) && !/^\d+$/.test(segment)
    )
    .map((segment) => segment.toLowerCase());

  if (segments[0] !== "api") segments.unshift("api");

  return segments.length > 1 ? `/${segments.join("/")}` : "";
}

const READ_CONFIG_QUERY = {
  staleTime: 1000 * 60 * 30,
  gcTime: 1000 * 60 * 60,
  retry: 1,
  refetchOnWindowFocus: false,
};

function entryFromConfig(config) {
  return {
    categoryId: config.subCategory?.categoryId ?? config.category?.id,
    subCategoryId: config.subCategory?.id,
    categoryName: config.category?.nameAr ?? config.category?.name,
    subCategoryName: config.subCategory?.nameAr ?? config.subCategory?.name,
    config,
  };
}

function indexConfigs(results) {
  const byModule = new Map();
  const byEndpoint = new Map();
  const byIds = new Map();

  results.forEach((result) => {
    const config = result.data?.data;

    if (!config) return;

    const entry = entryFromConfig(config);

    const moduleKey = normalizeModule(config.module);

    if (moduleKey && !byModule.has(moduleKey)) byModule.set(moduleKey, entry);

    if (entry.categoryId && entry.subCategoryId) {
      const ids = `${entry.categoryId}:${entry.subCategoryId}`;

      if (!byIds.has(ids)) byIds.set(ids, entry);
    }

    [config.list?.endpoint, config.details?.endpoint].forEach((endpoint) => {
      const key = endpointKey(endpoint);

      if (key && !byEndpoint.has(key)) byEndpoint.set(key, entry);
    });
  });

  return { byModule, byEndpoint, byIds };
}

export default function useListingRoutes(types = []) {
  const wanted = useMemo(() => {
    const seen = new Set();

    types.forEach((type) => {
      const key = normalizeModule(type);

      if (key) seen.add(key);
    });

    return [...seen];
  }, [types]);

  const { data: treeResponse } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: getCategoriesTree,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    enabled: wanted.length > 0,
  });

  const tree = treeResponse?.data;

  /* The same cached query `useListingModuleType` reads — asking for it here
     costs nothing beyond what the app already fetches once per session. */
  const { data: metadataResponse } = useQuery({
    queryKey: ["listing-interaction-metadata"],
    queryFn: getListingInteractionMetadata,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: wanted.length > 0,
  });

  /* Module name -> the pair it belongs to, straight from the backend. Modules
     published with no category of their own (`0/0`) are left out: they have no
     pair to offer, and the derivation below is the only thing that can help. */
  const byMetadataName = useMemo(() => {
    const index = new Map();

    (metadataResponse?.data?.modules ?? []).forEach((module) => {
      const key = normalizeModule(module?.name);

      const categoryId = Number(module?.categoryId);

      const subCategoryId = Number(module?.subCategoryId);

      if (!key || !categoryId || !subCategoryId) return;

      if (!index.has(key)) index.set(key, { categoryId, subCategoryId });
    });

    return index;
  }, [metadataResponse]);

  const namesWithoutPair = useMemo(() => {
    const index = new Map();

    (metadataResponse?.data?.modules ?? []).forEach((module) => {
      const key = normalizeModule(module?.name);

      if (!key || Number(module?.categoryId) || Number(module?.subCategoryId)) {
        return;
      }

      if (module?.nameAr && !index.has(key)) index.set(key, module.nameAr);
    });

    return index;
  }, [metadataResponse]);

  /* Every (category, sub-category) pair, plus the name-based guesses. */
  const { pairs, guesses } = useMemo(() => {
    const allPairs = [];
    const byName = new Map();

    (Array.isArray(tree) ? tree : []).forEach((category) => {
      (category.subCategories ?? []).forEach((subCategory) => {
        const pair = {
          categoryId: category.id,
          subCategoryId: subCategory.id,
          categoryName: category.nameAr ?? category.name,
          subCategoryName: subCategory.nameAr ?? subCategory.name,
        };

        allPairs.push(pair);

        // A sub-category name is the more specific claim, so it wins.
        const subKey = normalizeModule(subCategory.name);

        if (subKey && !byName.has(subKey)) byName.set(subKey, pair);
      });

      const categoryKey = normalizeModule(category.name);

      const first = (category.subCategories ?? [])[0];

      if (categoryKey && first && !byName.has(categoryKey)) {
        byName.set(categoryKey, {
          categoryId: category.id,
          subCategoryId: first.id,
          categoryName: category.nameAr ?? category.name,
          subCategoryName: first.nameAr ?? first.name,
        });
      }
    });

    return { pairs: allPairs, guesses: byName };
  }, [tree]);

  /* Where a metadata pair gets its Arabic wording — the tree is the side that
     names a category in the language the app is written in. */
  const pairsByIds = useMemo(() => {
    const index = new Map();

    pairs.forEach((pair) => {
      index.set(`${pair.categoryId}:${pair.subCategoryId}`, pair);
    });

    return index;
  }, [pairs]);

  /* Pairs worth reading first: one per type we have a name-based guess for. */
  const candidateIds = useMemo(() => {
    const ids = new Set();

    wanted.forEach((key) => {
      const guess = guesses.get(key);

      if (guess) ids.add(`${guess.categoryId}:${guess.subCategoryId}`);
    });

    return ids;
  }, [wanted, guesses]);

  const candidateResults = useQueries({
    queries: pairs
      .filter((pair) => candidateIds.has(`${pair.categoryId}:${pair.subCategoryId}`))
      .map((pair) => ({
        queryKey: ["read-config", pair.categoryId, pair.subCategoryId],
        queryFn: () => getReadConfig(pair.categoryId, pair.subCategoryId),
        ...READ_CONFIG_QUERY,
      })),
  });

  /* Results are new objects every render; their fetch timestamps are not. */
  const candidateStamp = candidateResults
    .map((result) => result.dataUpdatedAt)
    .join("|");

  const confirmed = useMemo(
    () => indexConfigs(candidateResults),
    [candidateStamp] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const settled = candidateResults.every(
    (result) => result.isSuccess || result.isError
  );

  const needsSweep =
    wanted.length > 0 &&
    pairs.length > 0 &&
    settled &&
    wanted.some(
      (key) => !byMetadataName.has(key) && !confirmed.byModule.has(key)
    );

  const sweepResults = useQueries({
    queries: pairs.map((pair) => ({
      queryKey: ["read-config", pair.categoryId, pair.subCategoryId],
      queryFn: () => getReadConfig(pair.categoryId, pair.subCategoryId),
      enabled: needsSweep,
      ...READ_CONFIG_QUERY,
    })),
  });

  const sweepStamp = sweepResults.map((result) => result.dataUpdatedAt).join("|");

  const swept = useMemo(
    () => indexConfigs(sweepResults),
    [sweepStamp] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const resolve = useMemo(() => {
    return (type) => {
      const key = normalizeModule(type);

      if (!key) return null;

      /* The backend's own answer, first. The config is attached when one has
         already been read for that pair, so callers that want the module's
         endpoint still get it without forcing a request. */
      const fromMetadata = byMetadataName.get(key);

      if (fromMetadata) {
        const ids = `${fromMetadata.categoryId}:${fromMetadata.subCategoryId}`;

        const named = pairsByIds.get(ids);

        const readConfig =
          confirmed.byIds?.get(ids) ?? swept.byIds?.get(ids) ?? null;

        return {
          ...fromMetadata,
          categoryName: named?.categoryName ?? readConfig?.categoryName ?? null,
          subCategoryName:
            named?.subCategoryName ?? readConfig?.subCategoryName ?? null,
          config: readConfig?.config ?? null,
        };
      }

      // A config that names the module is proof; a matching name is a guess.
      const match = confirmed.byModule.get(key) ?? swept.byModule.get(key);

      if (match?.subCategoryId) return match;

      const guess = guesses.get(key);

      if (guess) return { ...guess, config: null };

      /* Nameable but not navigable: no pair, so callers that need one still
         treat this as unresolved, while a label has something to show. */
      const nameOnly = namesWithoutPair.get(key);

      return nameOnly
        ? {
            categoryId: null,
            subCategoryId: null,
            categoryName: nameOnly,
            subCategoryName: null,
            config: null,
          }
        : null;
    };
  }, [byMetadataName, namesWithoutPair, pairsByIds, confirmed, swept, guesses]);

  const resolveByEndpoint = useMemo(() => {
    return (endpoint) => {
      const key = endpointKey(endpoint);

      if (!key) return null;

      const match =
        confirmed.byEndpoint.get(key) ?? swept.byEndpoint.get(key);

      return match?.subCategoryId ? match : null;
    };
  }, [confirmed, swept]);

  const isResolving =
    wanted.length > 0 &&
    (!tree ||
      candidateResults.some((result) => result.isLoading) ||
      (needsSweep && sweepResults.some((result) => result.isLoading)));

  return { resolve, resolveByEndpoint, isResolving };
}
