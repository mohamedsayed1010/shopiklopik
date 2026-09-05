import { useQuery } from "@tanstack/react-query";

import { getDynamicData } from "../api/products/products";

export default function useDynamicList(
  endpoint,
  params = {}
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
      "dynamic-list",
      endpoint,
      params,
    ],

    queryFn: () =>
      getDynamicData(endpoint, params),

    enabled: !!endpoint,

    staleTime: 1000 * 60 * 5, // 5 minutes

    gcTime: 1000 * 60 * 30, // 30 minutes

    placeholderData: (previousData) =>
      previousData,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  return {
    items: data?.data?.items ?? [],

    pagination: {
      totalCount:
        data?.data?.totalCount ?? 0,

      totalPages:
        data?.data?.totalPages ?? 0,

      pageIndex:
        data?.data?.pageIndex ?? 1,

      pageSize:
        data?.data?.pageSize ?? 10,

      hasNext:
        data?.data?.hasNext ?? false,

      hasPrevious:
        data?.data?.hasPrevious ??
        false,
    },

    rawData: data?.data ?? null,

    response: data ?? null,

    isLoading,

    isFetching,

    isError,

    error,

    refetch,
  };
}