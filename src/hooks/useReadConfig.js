import { useQuery } from "@tanstack/react-query";

import { getReadConfig } from "../api/categories/lookups";

export default function useReadConfig(
  categoryId,
  subCategoryId
) {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "read-config",
      categoryId,
      subCategoryId,
    ],

    queryFn: () =>
      getReadConfig(
        categoryId,
        subCategoryId
      ),

    enabled:
      !!categoryId &&
      !!subCategoryId,

    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    config: data?.data ?? null,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}