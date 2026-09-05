
function patchRow(row, id, patch) {
  if (!row || typeof row !== "object") return row;

  if (String(row.id) !== id) return row;

  const changed = Object.keys(patch).some((key) => row[key] !== patch[key]);

  return changed ? { ...row, ...patch } : row;
}

function patchEnvelope(payload, id, patch) {
  if (!payload || typeof payload !== "object") return payload;

  // Infinite queries hold their envelopes under `pages`.
  if (Array.isArray(payload.pages)) {
    const pages = payload.pages.map((page) => patchEnvelope(page, id, patch));

    return pages.some((page, index) => page !== payload.pages[index])
      ? { ...payload, pages }
      : payload;
  }

  const data = payload.data;

  if (!data || typeof data !== "object") return payload;

  if (Array.isArray(data)) {
    const rows = data.map((row) => patchRow(row, id, patch));

    return rows.some((row, index) => row !== data[index])
      ? { ...payload, data: rows }
      : payload;
  }

  if (Array.isArray(data.items)) {
    const items = data.items.map((row) => patchRow(row, id, patch));

    return items.some((row, index) => row !== data.items[index])
      ? { ...payload, data: { ...data, items } }
      : payload;
  }

  const patched = patchRow(data, id, patch);

  return patched === data ? payload : { ...payload, data: patched };
}

export function patchListingEverywhere(queryClient, id, patch) {
  if (!queryClient || id === undefined || id === null || !patch) return;

  const target = String(id);

  queryClient
    .getQueryCache()
    .getAll()
    .forEach((query) => {
      const cached = query.state.data;

      const next = patchEnvelope(cached, target, patch);

      if (next !== cached) queryClient.setQueryData(query.queryKey, next);
    });
}

export default patchListingEverywhere;
