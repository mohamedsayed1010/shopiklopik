
export const ADMIN_AUDIT_ROOT = ["admin-audit-logs"];

export const adminAuditListKey = (filters) => [
  ...ADMIN_AUDIT_ROOT,
  "list",
  filters,
];

export const adminAuditDetailsKey = (id) => [
  ...ADMIN_AUDIT_ROOT,
  "details",
  String(id ?? ""),
];

export const adminAuditMetadataKey = () => [...ADMIN_AUDIT_ROOT, "metadata"];
