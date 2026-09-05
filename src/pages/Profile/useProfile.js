import { useQuery } from "@tanstack/react-query";

import { getProfile } from "../../api/profile/getProfile";
import { PROFILE_QUERY_KEY } from "./profileCache";

export default function useProfile() {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    staleTime: 1000 * 60,
  });

  const profile = data?.data ?? null;

  return {
    profile,
    statistics: profile?.statistics ?? null,
    message: data?.message,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
