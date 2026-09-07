import { API_BASE_URL } from "../axiosInstance";

export const NOTIFICATIONS_HUB_URL = new URL(
  "hubs/notifications",
  API_BASE_URL
).toString();

/** Server-to-client method names, kept in one place rather than inline. */
export const HUB_EVENTS = {
  received: "ReceiveNotification",
  unreadCountChanged: "UnreadCountChanged",
};

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
       usually a tunnel or a screen lock, not an outage. */
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.None)
    .build();
}
