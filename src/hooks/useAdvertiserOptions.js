import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getDynamicData } from "../api/products/products";
import { listingSellerName } from "../utils/listingModel";

/** The API caps a page at 50 however many are asked for. */
const PAGE_SIZE = 50;

const MAX_PAGES = 10;

export default function useAdvertiserOptions(endpoint, { enabled = true } = {}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["advertiser-options", endpoint],

    queryFn: async () => {
      const rows = [];

      let pageIndex = 1;

      let totalPages = 1;

      while (pageIndex <= totalPages && pageIndex <= MAX_PAGES) {
        const response = await getDynamicData(endpoint, {
          pageIndex,
          pageSize: PAGE_SIZE,
        });

        rows.push(...(response?.data?.items ?? []));

        totalPages = response?.data?.totalPages ?? 1;

        pageIndex += 1;
      }

      return rows;
    },

    enabled: Boolean(endpoint) && enabled,

    staleTime: 1000 * 60 * 10,

    gcTime: 1000 * 60 * 30,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  /* One entry per distinct advertiser: the name is both what the reader picks
     and what the filter is set to, so it is also the key that de-duplicates
     them. An advertiser with several listings appears once. */
  const options = useMemo(() => {
    const byName = new Map();

    (data ?? []).forEach((row) => {
      const name = String(listingSellerName(row) ?? "").trim();

      if (!name || byName.has(name)) return;

      byName.set(name, { value: name, label: name });
    });

    return [...byName.values()].sort((a, b) =>
      a.label.localeCompare(b.label, "ar")
    );
  }, [data]);

  return { options, isLoading, isError };
}
