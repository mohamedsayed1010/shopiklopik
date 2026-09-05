import { useQuery } from "@tanstack/react-query";

import { getDynamicData } from "../api/products/products";

export default function useDynamicDetails(endpoint) {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "dynamic-details",
      endpoint,
    ],

    queryFn: () =>
      getDynamicData(endpoint),

    enabled: !!endpoint,

    staleTime: 1000 * 60 * 5,

    gcTime: 1000 * 60 * 30,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  return {
    item: data?.data ?? null,

    response: data ?? null,

    isLoading,

    isFetching,

    isError,

    error,

    refetch,
  };
}