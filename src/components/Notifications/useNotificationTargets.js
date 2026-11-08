import { useCallback, useMemo } from "react";

import useListingRoutes from "../../hooks/useListingRoutes";
import { readNotification } from "./notificationTarget";

export default function useNotificationTargets(notifications = []) {
  // Read the whole list once; both the hint set and the lookup reuse it.
  const parsed = useMemo(
    () => notifications.map((notification) => readNotification(notification)),
    [notifications]
  );

  const hints = useMemo(() => {
    const seen = new Set();

    /* One hint per notification — see `primaryHint`. Handing every alias over
       made any unplaceable one ("advertisements", "LostFoundPost") trigger a
       read-config request for every category in the catalogue. */
    parsed.forEach((entry) => {
      if (entry.pair || entry.kind !== "listing") return;

      if (entry.primaryHint) seen.add(entry.primaryHint);
    });

    return [...seen];
  }, [parsed]);

  /* A destination needs a pair, not a config: read-configs are fetched only
     for what the metadata cannot place (car notifications). */
  const { resolve, resolveByEndpoint, isResolving } = useListingRoutes(hints, {
    fetchConfigs: "unplaced",
  });

  const targetFor = useCallback(
    (notification) => {
      /* Submitted and edited listings are in review, and the public read
         withholds them — but this is the user's own inbox, and these
         notifications go only to the listing's owner, whom the module's details
         endpoint does serve while the listing is pending (verified in
         production on all 18 listing types, 2026-11-08). So they open the
         listing like any other; anyone else still gets the API's 404. */
      const entry = readNotification(notification);

      if (entry.kind === "app") return entry.to;

      if (entry.kind === "profile") return "/profile";

      if (!entry.id) return null;

      if (entry.pair) {
        const placed = `/dynamic/${entry.pair.categoryId}/${entry.pair.subCategoryId}/${entry.id}`;

        return entry.wantsComments ? `${placed}?focus=comments` : placed;
      }

      // An endpoint is an exact match; a module name is a near-certain one.
      const match =
        entry.endpointHints.reduce(
          (found, endpoint) => found ?? resolveByEndpoint(endpoint),
          null
        ) ??
        entry.moduleHints.reduce(
          (found, hint) => found ?? resolve(hint),
          null
        );

      if (!match?.categoryId || !match?.subCategoryId) return null;

      const to = `/dynamic/${match.categoryId}/${match.subCategoryId}/${entry.id}`;

      // The details page reads this and opens the comments sheet on arrival.
      return entry.wantsComments ? `${to}?focus=comments` : to;
    },
    [resolve, resolveByEndpoint]
  );

  return { targetFor, isResolving };
}
