import { createSeenIds } from "../../components/Notifications/notificationState";

/* The life of the notifications socket, from first connect to teardown.

   What went wrong before: the hub was built with
   `withAutomaticReconnect([0, 2000, 5000, 10000, 30000])` — five tries, then
   SignalR gives up and closes for good. Nothing listened for that close, and a
   first `start()` that failed was swallowed too, so a long session (a laptop
   lid, a train tunnel, a server restart) lost live notifications until the
   page was reloaded. Production showed exactly five failed negotiations and
   silence after them.

   Now:
   - the automatic-reconnect policy never runs out (the same quick first steps,
     then every 60 s);
   - a close that still happens (or a start that fails) schedules a restart of
     the same connection on that schedule;
   - coming back online or back to the tab retries at once instead of waiting;
   - handlers are registered once per connection — a restart reuses them, so
     nothing is subscribed twice;
   - a push seen twice is acted on once;
   - after any gap the caches are re-read once, because the hub does not replay
     what was sent while the socket was down.

   The access token is read by the connection's own `accessTokenFactory` on
   every negotiation, so each reconnect uses the current session's token. */

export const HUB_EVENTS = {
  received: "ReceiveNotification",
  unreadCountChanged: "UnreadCountChanged",
};

export const RECONNECT_STEPS = Object.freeze([0, 2000, 5000, 10000, 30000]);

export const MAX_RECONNECT_DELAY = 60000;

/** Delay before retry number `retryCount` (0-based). Never null: never gives up. */
export function reconnectDelay(retryCount) {
  const count = Number.isInteger(retryCount) && retryCount >= 0 ? retryCount : 0;

  return count < RECONNECT_STEPS.length ? RECONNECT_STEPS[count] : MAX_RECONNECT_DELAY;
}

/** For `HubConnectionBuilder.withAutomaticReconnect(policy)`. */
export const reconnectPolicy = Object.freeze({
  nextRetryDelayInMilliseconds: (context) => reconnectDelay(context?.previousRetryCount),
});

const DISCONNECTED = "Disconnected";

export function createNotificationsLifecycle({
  createConnection,
  onNotification,
  onUnreadCount,
  onResync,
  timers = { setTimeout, clearTimeout },
  windowTarget = typeof window !== "undefined" ? window : null,
  documentTarget = typeof document !== "undefined" ? document : null,
} = {}) {
  let connection = null;

  let disposed = false;

  let timer = null;

  let attempts = 0;

  /* Set when the socket was lost; cleared by the resync that follows the next
     successful (re)connect. The very first connect needs no resync — the
     queries are being fetched for the first time anyway. */
  let lostSinceLastResync = false;

  let inFlight = null;

  const seen = createSeenIds();

  const resync = () => {
    if (!lostSinceLastResync) return;

    lostSinceLastResync = false;

    onResync?.();
  };

  const clearTimer = () => {
    if (timer === null) return;

    timers.clearTimeout(timer);

    timer = null;
  };

  const schedule = () => {
    if (disposed || timer !== null) return;

    const delay = reconnectDelay(attempts);

    attempts += 1;

    timer = timers.setTimeout(() => {
      timer = null;

      start();
    }, delay);
  };

  const attach = (hub) => {
    hub.on(HUB_EVENTS.received, (notification) => {
      if (!seen.firstTime(notification?.id)) return;

      onNotification?.(notification);
    });

    hub.on(HUB_EVENTS.unreadCountChanged, (count) => {
      if (typeof count === "number") onUnreadCount?.(count);
    });

    hub.onreconnecting?.(() => {
      lostSinceLastResync = true;
    });

    hub.onreconnected?.(() => {
      attempts = 0;

      resync();
    });

    /* SignalR's own retries are exhausted, or the server closed the socket:
       restart the same connection — its handlers stay registered. */
    hub.onclose?.(() => {
      if (disposed) return;

      lostSinceLastResync = true;

      schedule();
    });
  };

  const start = () => {
    if (disposed) return Promise.resolve();

    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        if (!connection) {
          const hub = await createConnection();

          if (disposed) {
            hub?.stop?.().catch?.(() => {});

            return;
          }

          connection = hub;

          attach(hub);
        }

        if (connection.state && connection.state !== DISCONNECTED) return;

        await connection.start();

        if (disposed) return;

        attempts = 0;

        resync();
      } catch {
        if (disposed) return;

        lostSinceLastResync = lostSinceLastResync || connection !== null;

        schedule();
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  };

  /* Back online, or back on the tab: a socket that is down is retried now
     rather than at the end of a 60-second wait. */
  const retryNow = () => {
    if (disposed) return;

    if (connection && connection.state && connection.state !== DISCONNECTED) return;

    clearTimer();

    attempts = 0;

    start();
  };

  const onVisibility = () => {
    if (documentTarget?.visibilityState === "visible") retryNow();
  };

  windowTarget?.addEventListener?.("online", retryNow);

  documentTarget?.addEventListener?.("visibilitychange", onVisibility);

  return {
    start,

    retryNow,

    dispose() {
      if (disposed) return;

      disposed = true;

      clearTimer();

      windowTarget?.removeEventListener?.("online", retryNow);

      documentTarget?.removeEventListener?.("visibilitychange", onVisibility);

      if (!connection) return;

      connection.off?.(HUB_EVENTS.received);

      connection.off?.(HUB_EVENTS.unreadCountChanged);

      connection.stop?.()?.catch?.(() => {});

      connection = null;
    },

    /** For tests and diagnostics. */
    get state() {
      return {
        disposed,
        attempts,
        scheduled: timer !== null,
        connectionState: connection?.state ?? null,
      };
    },
  };
}
