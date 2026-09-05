
export function fillEndpoint(template, id) {
  if (!template || id === undefined || id === null || id === "") return null;

  return template.includes("{id}")
    ? template.replace("{id}", String(id))
    : template;
}

export function collectionOf(route) {
  if (!route) return null;

  const [collection] = String(route)
    .replace(/^\/+|\/+$/g, "")
    .replace(/^api\//, "")
    .split("/");

  return collection || null;
}

export function listingEndpoint({ detailsEndpoint, route, id } = {}) {
  const declared = fillEndpoint(detailsEndpoint, id);

  if (declared) return declared;

  const collection = collectionOf(route);

  if (!collection || id === undefined || id === null || id === "") return null;

  return `/api/${collection}/${id}`;
}
