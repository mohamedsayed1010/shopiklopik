import { useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "../../context/AuthContext";
import {
  createNotificationsHubConnection,
  HUB_EVENTS,
} from "../../api/notifications/notificationsHub";
import {
  publishNotification,
  publishReconnected,
} from "../../api/notifications/notificationEvents";
import { useNotificationsApi } from "./useNotifications";

export default function useNotificationsRealtime() {
  const queryClient = useQueryClient();

  const { token } = useContext(AuthContext);

  /* Whichever inbox this session reads. The push channel is the same socket
     for both, so the only thing that changes is which cache it refreshes. */
  const { listKey, countKey } = useNotificationsApi();

  useEffect(() => {
    // The hub rejects anonymous connections; nothing to subscribe to.
    if (!token) return undefined;

    let cancelled = false;

    let connection = null;

    const invalidateList = () =>
      queryClient.invalidateQueries({ queryKey: listKey });

    createNotificationsHubConnection()
      .then((hub) => {
        if (cancelled) return undefined;

        connection = hub;

        hub.on(HUB_EVENTS.received, (notification) => {
          invalidateList();

          /* The count usually arrives on its own event a moment later, but a
             push that only ever fires `ReceiveNotification` must still move
             the badge. */
          queryClient.invalidateQueries({ queryKey: countKey });

          publishNotification(notification);
        });

        hub.on(HUB_EVENTS.unreadCountChanged, (count) => {
          if (typeof count !== "number") return;

          const cached = queryClient.getQueryData(countKey);

          if (!cached) {
            queryClient.invalidateQueries({ queryKey: countKey });

            return;
          }

          queryClient.setQueryData(countKey, {
            ...cached,
            data: count,
          });
        });

        /* A reconnect means the socket was down for a while, and any push sent
           in that window is simply gone — the hub does not replay. Re-reading
           both queries is the only way back to the truth. */
        hub.onreconnected(() => {
          invalidateList();

          /* Same reasoning for every other subscriber: a push sent while the
             socket was down is gone, so anything relying on pushes has to
             re-read rather than wait for one that will never arrive. */
          queryClient.invalidateQueries({ queryKey: countKey });

          publishReconnected();
        });

        return hub.start();
      })
      .catch(() => {
      });

    return () => {
      cancelled = true;

      if (!connection) return;

      connection.off(HUB_EVENTS.received);
      connection.off(HUB_EVENTS.unreadCountChanged);

      /* `stop()` on a connection still starting rejects; the connection is
         being thrown away either way. */
      connection.stop().catch(() => {});
    };
  }, [token, queryClient, listKey, countKey]);
}
