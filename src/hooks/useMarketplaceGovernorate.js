import { useQuery } from "@tanstack/react-query";

import { getGovernorates } from "../api/categories/lookups";

export default function useMarketplaceGovernorate() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["governorates"],
    queryFn: getGovernorates,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const governorates = data?.data;

  const governorate = Array.isArray(governorates)
    ? governorates[0] ?? null
    : null;

  return {
    governorateId: governorate?.id ?? null,

    governorateName: governorate?.name ?? null,

    isLoading,

    isError,
  };
}
