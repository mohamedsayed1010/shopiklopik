import { useQuery } from "@tanstack/react-query";

import { getAdvertisementActions } from "../api/advertisements/interactions";
import useListingModuleType from "./useListingModuleType";

export const ADVERTISEMENT_ACTIONS_KEY = "advertisement-actions";

export const advertisementActionsKey = (id, type) => [
  ADVERTISEMENT_ACTIONS_KEY,
  id ? String(id) : null,
  Number.isFinite(type) ? type : null,
];

export default function useAdvertisementActions({
  id,
  type = null,
  categoryId = null,
  subCategoryId = null,
  enabled = true,
} = {}) {
  /* Only consulted when the caller could not name the module itself. */
  const { type: resolvedType, isResolved } = useListingModuleType(
    categoryId,
    subCategoryId
  );

  const moduleType = Number.isFinite(type) ? type : resolvedType;

  const canAsk = Boolean(id) && enabled && (Number.isFinite(type) || isResolved);

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: advertisementActionsKey(id, moduleType),

    queryFn: () => getAdvertisementActions(id, moduleType),

    enabled: canAsk,

    /* Short: favouriting and reporting both invalidate this, and it is the
       authority the UI paints permissions from. */
    staleTime: 1000 * 30,

    gcTime: 1000 * 60 * 10,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  return {
    actions: data?.data ?? null,

    /* True until the server has answered for this ad. Callers must not paint a
       `false` favourite or a hidden button while this is true — that is the
       flicker this hook exists to remove. */
    isLoading: canAsk && isPending,

    isFetching,

    isError,

    error,

    refetch,

    moduleType,
  };
}
