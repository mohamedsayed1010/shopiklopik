import { QueryClient } from "@tanstack/react-query";

/* Floors for any query that does not state its own. Thirty seconds stops a
   page opened twice in a row from asking twice; thirty minutes keeps a page
   left for a while ready to paint from cache when the reader comes back, with
   a background refetch rather than a skeleton. */
const QUERY_DEFAULTS = {
  queries: {
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 30,
  },
};

/* One client for the life of the tab — created once at module scope, so no
   render can rebuild it and throw away the cache. */
export const queryClient = new QueryClient({ defaultOptions: QUERY_DEFAULTS });
