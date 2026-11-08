import { useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "../../context/AuthContext";
import { createNotificationsHubConnection } from "../../api/notifications/notificationsHub";
import { createNotificationsLifecycle } from "../../api/notifications/notificationsLifecycle";
import {
  publishNotification,
  publishReconnected,
} from "../../api/notifications/notificationEvents";
import { useNotificationsApi } from "./useNotifications";

/* Keeps the notification caches live from the hub. The connection's whole life
   — retries that never give up, restarts after a close, one set of handlers,
   duplicate deliveries dropped, one re-read after any gap — is
   `createNotificationsLifecycle`; this hook only connects it to the caches. */
export default function useNotificationsRealtime() {
  const queryClient = useQueryClient();

  const { token } = useContext(AuthContext);

  /* Whichever inbox this session reads. The push channel is the same socket
     for both, so the only thing that changes is which cache it refreshes. */
  const { listKey, countKey } = useNotificationsApi();

  useEffect(() => {
    // The hub rejects anonymous connections; nothing to subscribe to.
    if (!token) return undefined;

    const lifecycle = createNotificationsLifecycle({
      createConnection: createNotificationsHubConnection,

      onNotification: (notification) => {
        queryClient.invalidateQueries({ queryKey: listKey });

        /* The count usually arrives on its own event a moment later, but a
           push that only ever fires `ReceiveNotification` must still move the
           badge. It is re-read, never incremented, so the two events cannot
           count one notification twice. */
        queryClient.invalidateQueries({ queryKey: countKey });

        publishNotification(notification);
      },

      onUnreadCount: (count) => {
        const cached = queryClient.getQueryData(countKey);

        if (!cached) {
          queryClient.invalidateQueries({ queryKey: countKey });

          return;
        }

        queryClient.setQueryData(countKey, { ...cached, data: count });
      },

      /* The socket was down for a while and the hub does not replay: re-read
         both, and tell every other subscriber to re-read too. */
      onResync: () => {
        queryClient.invalidateQueries({ queryKey: listKey });

        queryClient.invalidateQueries({ queryKey: countKey });

        publishReconnected();
      },
    });

    lifecycle.start();

    return () => lifecycle.dispose();
  }, [token, queryClient, listKey, countKey]);
}
