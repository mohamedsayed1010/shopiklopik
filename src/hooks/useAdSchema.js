import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getCreateAdForm } from "../api/createAd/createAd";
import { normalizeKey } from "../utils/adFieldLabels";

export default function useAdSchema(categoryId, subCategoryId, config) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["create-ad-form", categoryId, subCategoryId],

    queryFn: () => getCreateAdForm(categoryId, subCategoryId),

    enabled: Boolean(categoryId) && Boolean(subCategoryId),

    staleTime: 1000 * 60 * 30,

    gcTime: 1000 * 60 * 60,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  const schema = useMemo(() => {
    const form = data?.data ?? null;

    const fields = new Map();

    const sectionOrder = [];

    const register = (field) => {
      if (!field?.name) return;

      const key = normalizeKey(field.name);

      // The create form wins: it is the richer description (options, section).
      if (!fields.has(key)) fields.set(key, field);

      if (field.section && !sectionOrder.includes(field.section)) {
        sectionOrder.push(field.section);
      }
    };

    (form?.fields ?? []).forEach(register);

    (config?.list?.queryParameters ?? []).forEach(register);

    (config?.details?.routeParameters ?? []).forEach(register);

    return {
      fields,

      lookups: form?.lookups ?? {},

      sectionOrder,

      getField: (key) => fields.get(normalizeKey(key)) ?? null,

      isReady: fields.size > 0,
    };
  }, [data, config]);

  return { schema, isLoading, isError };
}
