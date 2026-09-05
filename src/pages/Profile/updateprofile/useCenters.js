import { useQuery } from "@tanstack/react-query";

import { getCenters, getGovernorates } from "../../../api/categories/lookups";

const LOOKUP_QUERY = {
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
  refetchOnWindowFocus: false,
};

function normalize(value) {
  return String(value ?? "").trim();
}

export default function useCenters(governorateName) {
  const { data: governoratesResponse, isLoading: isGovernoratesLoading } =
    useQuery({
      queryKey: ["governorates"],
      queryFn: getGovernorates,
      ...LOOKUP_QUERY,
    });

  const governorates = governoratesResponse?.data;

  const match = Array.isArray(governorates)
    ? governorates.find(
        (item) => normalize(item?.name) === normalize(governorateName)
      ) ?? governorates[0]
    : null;

  const governorateId = match?.id ?? null;

  const { data: centersResponse, isLoading: isCentersLoading } = useQuery({
    queryKey: ["centers", governorateId],
    queryFn: () => getCenters(governorateId),
    enabled: governorateId !== null,
    ...LOOKUP_QUERY,
  });

  const centers = (centersResponse?.data ?? [])
    .map((center) => normalize(center?.name))
    .filter(Boolean);

  return {
    centers,
    isLoading: isGovernoratesLoading || isCentersLoading,
  };
}
