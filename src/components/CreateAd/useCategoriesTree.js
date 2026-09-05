import { useQuery } from "@tanstack/react-query";

import { getCategoriesTree } from "../../api/categories/categories";

export default function useCategoriesTree() {
  const {
    data,
    isLoading,
    isError,
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
    error,
  };
}