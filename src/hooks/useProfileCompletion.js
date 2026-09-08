import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";

import { AuthContext } from "../context/AuthContext";
import { getProfile } from "../api/profile/getProfile";
import { PROFILE_QUERY_KEY } from "../pages/Profile/profileCache";
import {
  isProfileComplete,
  missingCompletableFields,
} from "../utils/profileCompletion";

/**
 * The signed-in account's completeness, from the server's own record.
 *
 * Reads `GET /api/profile` under the key the profile page already uses, so the
 * two share one request and one cache entry rather than asking twice.
 *
 * The session's stored `UserDto` seeds the answer while that request is in
 * flight. It is the same record, written by whichever endpoint last issued the
 * session, and it carries the same fields — so a reader whose stored account is
 * already short of something is stopped on the first paint instead of watching
 * a page appear and then be taken away. It only ever *seeds*: the server's
 * answer replaces it the moment it lands.
 *
 * Statuses: `signed-out`, `pending` (nothing to decide on yet), `complete`,
 * `incomplete`, `error` (the profile could not be read — which is not a yes).
 */
export default function useProfileCompletion() {
  const { isAuthenticated, user } = useContext(AuthContext);

  const query = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60,

    /* One retry, not the default three. Until this answers, a reader whose
       stored account looks complete is still being let through — so time spent
       retrying is time the site is open on an unverified record. A network blip
       is still absorbed; a backend that is actually down is decided in about a
       second rather than in eight. */
    retry: 1,
  });

  const profile = query.data?.data ?? null;

  const record = profile ?? user ?? null;

  const status = (() => {
    if (!isAuthenticated) return "signed-out";

    if (profile) return isProfileComplete(profile) ? "complete" : "incomplete";

    if (query.isError) return "error";

    /* No server answer yet. A stored account already short of a required field
       is decided — waiting cannot make it complete. One that looks complete is
       taken at its word for now, and re-decided above as soon as the request
       lands. */
    if (user) return isProfileComplete(user) ? "complete" : "incomplete";

    return "pending";
  })();

  return {
    status,
    profile,
    /* What the reader still owes: from the server's record once it has arrived,
       and from the stored one until then. */
    missing: record ? missingCompletableFields(record) : [],
    isComplete: status === "complete",
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
