import { useCallback, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getReadConfig } from "../api/categories/lookups";

export default function useReadConfigs(pairs = []) {
  const unique = useMemo(() => {
    const seen = new Map();

    pairs.forEach((pair) => {
      const categoryId = Number(pair?.categoryId);

      const subCategoryId = Number(pair?.subCategoryId);

      if (!categoryId || !subCategoryId) return;

      const key = `${categoryId}:${subCategoryId}`;

      if (!seen.has(key)) seen.set(key, { categoryId, subCategoryId });
    });

    return [...seen.values()];
  }, [pairs]);

  const results = useQueries({
    queries: unique.map((pair) => ({
      queryKey: ["read-config", pair.categoryId, pair.subCategoryId],
      queryFn: () => getReadConfig(pair.categoryId, pair.subCategoryId),
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });

  /* Results are new objects every render; their fetch timestamps are not. */
  const stamp = results.map((result) => result.dataUpdatedAt).join("|");

  const index = useMemo(() => {
    const map = new Map();

    unique.forEach((pair, position) => {
      const config = results[position]?.data?.data;

      if (config) map.set(`${pair.categoryId}:${pair.subCategoryId}`, config);
    });

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp, unique]);

  const configFor = useCallback(
    (categoryId, subCategoryId) =>
      index.get(`${Number(categoryId)}:${Number(subCategoryId)}`) ?? null,
    [index]
  );

  return { configFor, isLoading: results.some((result) => result.isLoading) };
}
