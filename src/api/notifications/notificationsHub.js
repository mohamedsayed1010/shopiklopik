import { API_BASE_URL } from "../axiosInstance";
import { HUB_EVENTS, reconnectPolicy } from "./notificationsLifecycle";

export const NOTIFICATIONS_HUB_URL = new URL(
  "hubs/notifications",
  API_BASE_URL
).toString();

/** Server-to-client method names — one definition, shared with the lifecycle. */
export { HUB_EVENTS };

export async function createNotificationsHubConnection() {
  const { HubConnectionBuilder, HttpTransportType, LogLevel } = await import(
    "@microsoft/signalr"
  );

  return new HubConnectionBuilder()
    .withUrl(NOTIFICATIONS_HUB_URL, {
      accessTokenFactory: () => localStorage.getItem("accessToken") ?? "",
      // Long polling would keep a request in flight per tab; the server offers
      // WebSockets and SSE, and both are cheaper than that.
      transport:
        HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents,
      withCredentials: false,
    })
    /* Backing off rather than hammering: a dropped socket on a phone is
       usually a tunnel or a screen lock, not an outage. The policy never runs
       out — a fixed list of five delays made SignalR give up for good after
       about 47 seconds. See `notificationsLifecycle`. */
    .withAutomaticReconnect(reconnectPolicy)
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.None)
    .build();
}
