import { useQuery } from "@tanstack/react-query";

import { getCategoriesTree } from "../../api/categories/categories";

export default function useCategoriesTree() {
  const {
    data,
    isLoading,
    isError,
    isSuccess,
    error,
  } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: getCategoriesTree,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,


  });

  return {
    categories: data?.data || [],
    isLoading,
    isError,
    /* The tree answered. Distinct from `!isLoading`, which is also true while
       the query sits pending and unfetched — offline, say — with nothing to
       read; a caller deciding that an id is absent needs the answer itself,
       not merely the absence of a spinner. */
    isSuccess,
    error,
  };
}