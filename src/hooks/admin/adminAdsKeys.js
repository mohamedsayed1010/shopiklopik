
export const ADMIN_ADS_ROOT = ["admin-ads"];

/** A list page: the endpoint it came from plus every filter that shaped it. */
export const adminAdsListKey = (endpoint, filters) => [
  ...ADMIN_ADS_ROOT,
  "list",
  endpoint,
  filters,
];

export const adminPendingCountKey = () => [...ADMIN_ADS_ROOT, "pending-count"];

export const adminAdsMetadataKey = () => [...ADMIN_ADS_ROOT, "metadata"];

export const adminAdDetailsKey = (type, id) => [
  ...ADMIN_ADS_ROOT,
  "details",
  String(type),
  String(id),
];

/** The stat cards: one cheap `PageSize=1` read per card, keyed by its filter. */
export const adminAdsStatKey = (filters) => [
  ...ADMIN_ADS_ROOT,
  "stat",
  filters,
];
