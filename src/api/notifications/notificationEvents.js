
const listeners = { notification: new Set(), reconnected: new Set() };

export function onNotificationReceived(handler) {
  listeners.notification.add(handler);

  return () => listeners.notification.delete(handler);
}

/** Subscribe to "the socket came back after being away". Same contract. */
export function onNotificationsReconnected(handler) {
  listeners.reconnected.add(handler);

  return () => listeners.reconnected.delete(handler);
}

function publish(kind, payload) {
  listeners[kind].forEach((handler) => {
    try {
      handler(payload);
    } catch {
      /* One subscriber's failure is not the channel's. */
    }
  });
}

export function publishNotification(dto) {
  publish("notification", dto);
}

export function publishReconnected() {
  publish("reconnected");
}
