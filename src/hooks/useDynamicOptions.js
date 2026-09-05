import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getDynamicData } from "../api/products/products";

export default function useDynamicOptions(
  config,
  values = {},
  { skipFields = null } = {}
) {
  const fields = useMemo(() => {
    const all = [
      ...(config?.list?.queryParameters ?? []),
      ...(config?.createForm?.fields ?? []),
    ];

    return skipFields ? all.filter((field) => !skipFields.has(field.name)) : all;
  }, [config, skipFields]);

  const optionFields = useMemo(() => {
    const unique = new Map();

    fields.forEach((field) => {
      if (
        !field.optionsSource ||
        !config?.operations?.[field.optionsSource]
      ) {
        return;
      }

      if (!unique.has(field.optionsSource)) {
        unique.set(field.optionsSource, field);
      }
    });

    return [...unique.values()];
  }, [fields, config]);

  const queries = useQueries({
    queries: optionFields.map((field) => {
      const operation =
        config.operations[field.optionsSource];

      let endpoint = operation.endpoint;

      let enabled = true;

      if (
        operation.routeParameters?.length
      ) {
        operation.routeParameters.forEach(
          (param) => {
            const value =
              values?.[param.name];

            if (
              value === undefined ||
              value === null ||
              value === ""
            ) {
              enabled = false;
              return;
            }

            endpoint = endpoint.replace(
              `{${param.name}}`,
              value
            );
          }
        );
      }

      return {
        queryKey: [
          "dynamic-options",
          field.optionsSource,
          endpoint,
        ],

        queryFn: () =>
          getDynamicData(endpoint),

        enabled,

        staleTime: 1000 * 60 * 30,

        gcTime: 1000 * 60 * 60,

        retry: 1,

        refetchOnWindowFocus: false,
      };
    }),
  });

  const options = useMemo(() => {
    const result = {};

    optionFields.forEach(
      (field, index) => {
        result[field.optionsSource] =
          queries[index]?.data?.data ?? [];
      }
    );

    return result;
  }, [optionFields, queries]);

  const optionsStatus = useMemo(() => {
    const result = {};

    optionFields.forEach((field, index) => {
      result[field.optionsSource] = {
        isLoading: queries[index]?.isLoading ?? false,

        isError: queries[index]?.isError ?? false,
      };
    });

    return result;
  }, [optionFields, queries]);

  return {
    options,

    optionsStatus,

    isLoading: queries.some(
      (q) => q.isLoading
    ),

    isFetching: queries.some(
      (q) => q.isFetching
    ),

    isError: queries.some(
      (q) => q.isError
    ),

    errors: queries
      .filter((q) => q.error)
      .map((q) => q.error),

    refetch: () =>
      Promise.all(
        queries.map((q) => q.refetch())
      ),
  };
}