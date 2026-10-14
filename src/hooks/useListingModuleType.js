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

export const INACTIVE_SUBCATEGORY_MESSAGE = "هذا القسم معطّل حاليًا.";

/* An inactive subcategory answers read-config and create-ad-form with the same
   404 as an id that never existed ("القسم الفرعي 51 مش موجود."), but metadata
   still lists its module. So a 404 for a pair metadata knows is a section that
   was switched off, not a mistyped address. Metadata is only read on a 404. */
export function useIsInactiveSubCategory(categoryId, subCategoryId, error) {
  const notFound = error?.response?.status === 404;

  const { data } = useQuery({ ...METADATA_QUERY, enabled: notFound });

  if (!notFound) return false;

  return (data?.data?.modules ?? []).some(
    (module) =>
      Number(module?.categoryId) === Number(categoryId) &&
      Number(module?.subCategoryId) === Number(subCategoryId)
  );
}
