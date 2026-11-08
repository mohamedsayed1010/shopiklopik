/* Pure helpers for the notification caches. The hooks hand React Query these
   functions; nothing here talks to the network or to React, so every rule about
   read-state and counts is testable on its own. */

/** The unread number the drawer shows: the server's count, the bell's number. */
export function drawerUnreadCount(serverCount, loadedNotifications = []) {
  if (typeof serverCount === "number" && Number.isFinite(serverCount) && serverCount >= 0) {
    return serverCount;
  }

  return (Array.isArray(loadedNotifications) ? loadedNotifications : []).filter(
    (item) => item && !item.isRead
  ).length;
}

/** A cached list response with one row marked read. Same object when nothing changes. */
export function markOneReadInList(response, id) {
  const items = response?.data?.items;

  if (!Array.isArray(items)) return response;

  let changed = false;

  const next = items.map((item) => {
    if (item?.id !== id || item.isRead) return item;

    changed = true;

    return { ...item, isRead: true };
  });

  return changed ? { ...response, data: { ...response.data, items: next } } : response;
}

/** A cached list response with every row read. Same object when nothing changes. */
export function markAllReadInList(response) {
  const items = response?.data?.items;

  if (!Array.isArray(items) || items.every((item) => item?.isRead)) return response;

  return {
    ...response,
    data: {
      ...response.data,
      items: items.map((item) => (item && !item.isRead ? { ...item, isRead: true } : item)),
    },
  };
}

/**
 * The count after one notification is read — only when that row was unread in
 * what the user is looking at, so a second click (or a row already read) never
 * takes the badge down twice. Never below zero.
 */
export function countAfterReadingOne(countResponse, wasUnread) {
  const count = countResponse?.data;

  if (typeof count !== "number" || !wasUnread) return countResponse;

  return { ...countResponse, data: Math.max(0, count - 1) };
}

export function countAfterReadingAll(countResponse) {
  if (typeof countResponse?.data !== "number") return countResponse;

  return { ...countResponse, data: 0 };
}

/** Was this id unread in any cached list page? */
export function wasUnreadInLists(listEntries = [], id) {
  return listEntries.some(([, response]) =>
    (response?.data?.items ?? []).some((item) => item?.id === id && !item.isRead)
  );
}

/**
 * Remembers which pushed notifications were already handled, so the same
 * delivery arriving twice (a reconnect overlapping a send, two handlers on a
 * transport that briefly duplicated) is acted on once. Bounded: the oldest ids
 * are forgotten first.
 */
export function createSeenIds(limit = 200) {
  const seen = new Set();

  return {
    /** True the first time an id is offered, false for repeats. Ids missing → always true. */
    firstTime(id) {
      if (id === undefined || id === null || id === "") return true;

      const key = String(id);

      if (seen.has(key)) return false;

      seen.add(key);

      if (seen.size > limit) seen.delete(seen.values().next().value);

      return true;
    },

    get size() {
      return seen.size;
    },
  };
}
