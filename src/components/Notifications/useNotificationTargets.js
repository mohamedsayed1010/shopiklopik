import { useCallback, useMemo } from "react";

import useListingRoutes from "../../hooks/useListingRoutes";
import { readNotification } from "./notificationTarget";
import {
  isAwaitingReview,
  isEditedAwaitingReview,
} from "../../api/notifications/notificationTypes";

export default function useNotificationTargets(notifications = []) {
  // Read the whole list once; both the hint set and the lookup reuse it.
  const parsed = useMemo(
    () => notifications.map((notification) => readNotification(notification)),
    [notifications]
  );

  const hints = useMemo(() => {
    const seen = new Set();

    parsed.forEach((entry) => {
      if (entry.pair) return;

      (entry.moduleHints ?? []).forEach((hint) => seen.add(hint));
    });

    return [...seen];
  }, [parsed]);

  const { resolve, resolveByEndpoint, isResolving } = useListingRoutes(hints);

  const targetFor = useCallback(
    (notification) => {
      if (isAwaitingReview(notification)) return null;

      /* An edit returns a published listing to moderation, and the public read
         withholds it exactly as it does a new submission — same outcome, same
         handling. See `isEditedAwaitingReview`. */
      if (isEditedAwaitingReview(notification)) return null;

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
