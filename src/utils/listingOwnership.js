/**
 * Whether the signed-in reader owns the listing on screen.
 *
 * The server's answer (`GET /api/advertisements/{id}/actions` → `isOwner`) is
 * the authority whenever it exists, and it is never second-guessed: an
 * explicit `false` stays `false`.
 *
 * It does not always exist. For a listing still under review that endpoint
 * answers 404 even to its owner, while the module's own details endpoint
 * serves the owner the record — and that record names its owner. Only then is
 * the record consulted: the owner id the backend published on it (`ownerId` on
 * every module's details DTO, `owner.id` on the cars `AdvertisementDetailsDto`)
 * against the signed-in account's id.
 *
 * This only decides what the page *offers*. Every owner action is still
 * authorised by the server on its own request; a wrong answer here can show a
 * control the server then refuses, never grant one.
 */

function idOf(value) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();

  return text ? text.toLowerCase() : null;
}

/** The owner id a details record publishes, or null when it publishes none. */
export function recordOwnerId(record) {
  if (!record || typeof record !== "object") return null;

  return idOf(record.ownerId) ?? idOf(record.owner?.id);
}

/**
 * `{ isOwner, source }` where `source` is `"actions"` (the server's answer),
 * `"record"` (the details record, used only when there is no server answer) or
 * `null` (nothing to decide on — not the owner).
 */
export function resolveListingOwnership({ actions = null, record = null, userId = null } = {}) {
  if (actions && typeof actions.isOwner === "boolean") {
    return { isOwner: actions.isOwner, source: "actions" };
  }

  const reader = idOf(userId);

  const owner = recordOwnerId(record);

  if (reader && owner && reader === owner) return { isOwner: true, source: "record" };

  return { isOwner: false, source: null };
}
