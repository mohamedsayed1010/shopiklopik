import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { recordAdvertisementView } from "../api/advertisements/interactions";
import { RECENTLY_VIEWED_QUERY_KEY } from "./useRecentlyViewed";

function patchRow(row, id, views) {
  if (!row || typeof row !== "object") return row;

  if (String(row.id) !== id) return row;

  if (Number(row.views) === views) return row;

  return { ...row, views };
}

function patchEnvelope(payload, id, views) {
  const data = payload?.data;

  if (!data || typeof data !== "object") return payload;

  if (Array.isArray(data)) {
    const rows = data.map((row) => patchRow(row, id, views));

    return rows.some((row, index) => row !== data[index])
      ? { ...payload, data: rows }
      : payload;
  }

  if (Array.isArray(data.items)) {
    const rows = data.items.map((row) => patchRow(row, id, views));

    return rows.some((row, index) => row !== data.items[index])
      ? { ...payload, data: { ...data, items: rows } }
      : payload;
  }

  const patched = patchRow(data, id, views);

  return patched === data ? payload : { ...payload, data: patched };
}

function patchCached(cached, id, views) {
  if (!cached || typeof cached !== "object") return cached;

  return patchEnvelope(cached, id, views);
}

export default function useAdvertisementView({ id, type = null, enabled = true }) {
  /* The key is stored alongside the result so a resolved request can never
     paint ad A's count onto ad B — the details route reuses this hook across
     `:id` changes. */
  const [state, setState] = useState({
    key: null,
    totalViews: null,
    lastViewedAt: null,
    counted: null,
  });

  const requestedKey = useRef(null);

  const isMounted = useRef(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const key = enabled && id ? `${id}:${type ?? ""}` : null;

  useEffect(() => {
    if (!key) return;

    if (requestedKey.current === key) return;

    requestedKey.current = key;

    recordAdvertisementView(id, type)
      .then((response) => {
        const result = response?.data;

        // Unmounted, or the visitor already moved on to another ad.
        if (!isMounted.current || requestedKey.current !== key) return;

        if (!result || !Number.isFinite(Number(result.totalViews))) return;

        const totalViews = Number(result.totalViews);

        setState({
          key,
          totalViews,
          lastViewedAt: result.lastViewedAt ?? null,
          counted: result.counted === true,
        });

        /* Same number, everywhere this ad is already cached — the grid behind
           the page, the rails, the related strip. Only entries that actually
           change are written back, so nothing else re-renders. */
        const adId = String(id);

        queryClient
          .getQueryCache()
          .getAll()
          .forEach((query) => {
            const cached = query.state.data;

            const next = patchCached(cached, adId, totalViews);

            if (next !== cached) queryClient.setQueryData(query.queryKey, next);
          });

        queryClient.invalidateQueries({ queryKey: RECENTLY_VIEWED_QUERY_KEY });
      })
      .catch(() => {
        /* Secondary to the ad itself — the page keeps working untouched. */
      });
  }, [key, id, type, queryClient]);

  const isCurrent = state.key !== null && state.key === key;

  return {
    /** The server's count, or null until it has answered for *this* ad. */
    totalViews: isCurrent ? state.totalViews : null,

    /** Whether the backend treated this opening as a new view. */
    counted: isCurrent ? state.counted : null,

    lastViewedAt: isCurrent ? state.lastViewedAt : null,
  };
}
