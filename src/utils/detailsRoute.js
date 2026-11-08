/* The details page's own address, corrected from the record it loaded.

   A link can only be as precise as what it was built from. A car notification
   says "Advertisement" and nothing more — the metadata publishes no category
   pair for cars (0:0) — so it lands on the first car sub-category, while the ad
   itself may be a taxi or a motorcycle. Every car sub-category reads its
   details from the same `/api/ads/{id}`, so the record loads either way, and
   the record states its real pair. This answers the address the page should be
   on, or null when it already is (or when the record cannot say).

   Only a record whose id is the one asked for, and whose pair is two positive
   integers, can move the page — nothing is guessed. */
export function canonicalDetailsPath({ categoryId, subCategoryId, id }, record, location = {}) {
  if (!record || typeof record !== "object") return null;

  if (record.id !== undefined && String(record.id).toLowerCase() !== String(id).toLowerCase()) {
    return null;
  }

  const actualCategory = Number(record.categoryId);

  const actualSubCategory = Number(record.subCategoryId);

  if (!Number.isInteger(actualCategory) || actualCategory <= 0) return null;

  if (!Number.isInteger(actualSubCategory) || actualSubCategory <= 0) return null;

  if (actualCategory === Number(categoryId) && actualSubCategory === Number(subCategoryId)) {
    return null;
  }

  return `/dynamic/${actualCategory}/${actualSubCategory}/${id}${location.search ?? ""}${location.hash ?? ""}`;
}
