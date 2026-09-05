import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDynamicData } from "../api/products/products";
import {
  onNotificationReceived,
  onNotificationsReconnected,
} from "../api/notifications/notificationEvents";
import { isNoLongerEligible } from "../api/notifications/notificationTypes";
import { METADATA_QUERY } from "./useListingModuleType";
import { normalizeModule } from "./useListingRoutes";
import { collectionOf } from "../utils/listingEndpoint";
import { isUrgentAt, urgentRowsAt } from "../utils/charityUrgency";

const URGENT_MODULES = ["BloodRequest", "Rescue"];

const PAGE_SIZE = 50;

export default function useUrgentCharityRequests() {
  const queryClient = useQueryClient();

  /* The same cached metadata query the details page and the report form use —
     one request per session, shared, never a second one for this. */
  const { data: metadata } = useQuery(METADATA_QUERY);

  const modules = useMemo(
    () =>
      (metadata?.data?.modules ?? [])
        .filter((module) => URGENT_MODULES.includes(module?.name))
        .map((module) => ({ ...module, collection: collectionOf(module.route) }))
        .filter((module) => module.collection),
    [metadata]
  );

  const results = useQueries({
    queries: modules.map((module) => ({
      queryKey: ["urgent-charity", module.collection],

      queryFn: () =>
        getDynamicData(`/api/${module.collection}`, {
          pageIndex: 1,
          pageSize: PAGE_SIZE,
          sortBy: 1,
        }),

      /* Discovery is the socket's job. Without this the list would be re-read
         on every remount and every window focus, which is the polling this
         feature deliberately does not do. */
      staleTime: Infinity,

      refetchOnWindowFocus: false,

      refetchOnMount: false,

      refetchOnReconnect: false,

      /* The bar lives in `Layout` and is never unmounted, but a long gcTime
         also means a brief unmount (maintenance mode, an auth screen) does not
         throw the startup read away and pay for it again. */
      gcTime: 60 * 60 * 1000,

      retry: 1,
    })),
  });

  const latestRead = useRef(new Map());

  /** Drop one record from a module's cached list. */
  const removeRow = useCallback(
    (key, id) =>
      queryClient.setQueryData(key, (current) => {
        const items = current?.data?.items ?? [];

        if (!items.some((row) => row?.id === id)) return current;

        return {
          ...current,
          data: { ...current.data, items: items.filter((row) => row?.id !== id) },
        };
      }),
    [queryClient]
  );

  const applyNotification = useCallback(
    async (notification) => {
      if (!notification || modules.length === 0) return;

      const module = modules.find(
        (candidate) =>
          (notification.listingType != null &&
            candidate.id === notification.listingType) ||
          (Boolean(notification.referenceType) &&
            normalizeModule(candidate.name) ===
              normalizeModule(notification.referenceType))
      );

      // Not a blood request or a rescue — nothing to do, and no request made.
      if (!module) return;

      const key = ["urgent-charity", module.collection];

      /* `referenceId` is nullable. Without an id there is nothing to address,
         so this falls back to re-reading *that one module's* list — still a
         single request, and still only the module the push named. */
      if (!notification.referenceId) {
        queryClient.invalidateQueries({ queryKey: key });

        return;
      }

      const id = notification.referenceId;

      if (isNoLongerEligible(notification)) {
        latestRead.current.set(
          `${module.collection}:${id}`,
          (latestRead.current.get(`${module.collection}:${id}`) ?? 0) + 1
        );

        removeRow(key, id);

        return;
      }

      const ticketKey = `${module.collection}:${id}`;

      const ticket = (latestRead.current.get(ticketKey) ?? 0) + 1;

      latestRead.current.set(ticketKey, ticket);

      const isStale = () => latestRead.current.get(ticketKey) !== ticket;

      let record = null;

      try {
        const response = await getDynamicData(`/api/${module.collection}/${id}`);

        record = response?.data ?? null;
      } catch (error) {
        const status = error?.response?.status;

        /* The server withheld it: rejected, suspended, or deleted. That is an
           answer, and the row must go now rather than sit out its countdown.
           Anything else (offline, 5xx) is not an answer and changes nothing. */
        if (status === 403 || status === 404 || status === 410) {
          if (!isStale()) removeRow(key, id);
        }

        return;
      }

      if (isStale()) return;

      /* A 200 that is no longer eligible counts too: some backends answer with
         the record and a cleared `approvedAt` rather than withholding it.
         Either way the rule below decides, never this function. */
      if (!record?.id) {
        removeRow(key, id);

        return;
      }

      queryClient.setQueryData(key, (current) => {
        const items = current?.data?.items ?? [];

        const isKnown = items.some((row) => row?.id === record.id);

        if (!isKnown && !isUrgentAt(record)) return current;

        return {
          ...(current ?? { success: true }),
          data: {
            ...(current?.data ?? {}),
            items: isKnown
              ? items.map((row) =>
                  row?.id === record.id ? { ...row, ...record } : row
                )
              : [record, ...items],
          },
        };
      });
    },
    [modules, queryClient, removeRow]
  );

  /* One subscription to the app's single hub connection — see
     `api/notifications/notificationEvents`. No socket is opened here. */
  useEffect(() => onNotificationReceived(applyNotification), [applyNotification]);

  /* A push sent while the socket was down is gone; the hub does not replay.
     Re-reading on reconnect is a recovery path, not a schedule — it fires only
     when the connection actually comes back. */
  useEffect(
    () =>
      onNotificationsReconnected(() =>
        queryClient.invalidateQueries({ queryKey: ["urgent-charity"] })
      ),
    [queryClient]
  );

  const items = results.flatMap((result) => result.data?.data?.items ?? []);

  const [tick, setTick] = useState(() => Date.now());

  const lastFetchedAt = results.reduce(
    (latest, result) => Math.max(latest, result.dataUpdatedAt || 0),
    0
  );

  const rows = urgentRowsAt(items, Math.max(tick, lastFetchedAt));

  const isTicking = rows.length > 0;

  /* Local only: this timer re-renders the countdown and expires a row. It
     never touches the network. Nothing on the bar means nothing to expire, so
     an idle visitor on any other page pays for no timer at all. */
  useEffect(() => {
    if (!isTicking) return undefined;

    const timer = setInterval(() => setTick(Date.now()), 1000);

    return () => clearInterval(timer);
  }, [isTicking]);

  return rows;
}
