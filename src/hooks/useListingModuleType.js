import { useQuery } from "@tanstack/react-query";

import { getListingInteractionMetadata } from "../api/advertisements/interactions";

export const METADATA_QUERY = {
  queryKey: ["listing-interaction-metadata"],

  queryFn: getListingInteractionMetadata,

  staleTime: 1000 * 60 * 60,

  gcTime: 1000 * 60 * 60 * 24,

  retry: 1,

  refetchOnWindowFocus: false,
};

export function useReportReasons() {
  const { data, isPending, isError, refetch } = useQuery(METADATA_QUERY);

  const reasons = (data?.data?.reportReasons ?? []).filter(
    (reason) => Number.isFinite(Number(reason?.id)) && reason?.name
  );

  return { reasons, isLoading: isPending, isError, refetch };
}

export default function useListingModuleType(categoryId, subCategoryId) {
  const { data, isPending, isError } = useQuery(METADATA_QUERY);

  const modules = data?.data?.modules ?? [];

  const exact = modules.find(
    (module) =>
      Number(module?.categoryId) === Number(categoryId) &&
      Number(module?.subCategoryId) === Number(subCategoryId)
  );

  const generic = modules.find(
    (module) => !Number(module?.categoryId) && !Number(module?.subCategoryId)
  );

  const resolved = exact ?? generic;

  const type = Number.isFinite(Number(resolved?.id)) ? Number(resolved.id) : null;

  return {
    type,

    isResolved: !isPending,

    isError,
  };
}
