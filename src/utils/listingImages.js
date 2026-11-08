import { FILE_TYPES } from "./dynamicForm";

/* Photos of a listing whose update cannot carry them.

   Cars update through `PUT /api/ads/{id}` with a JSON body
   (`UpdateAdvertisementRequest`), which has no image field — JSON cannot carry
   files, and `buildJsonBody` skips file fields. Before this, a car owner who
   picked photos on the edit page had them dropped without a word, and the
   photos the car already had were never shown (they were only listed for
   modules whose multipart update takes `RemoveImageIds`).

   The same contract publishes the photo operations separately (Swagger V1):
     POST   /api/ads/{id}/images      multipart, `Images[]`  — add
     DELETE /api/ads/image/{imageId}                         — remove one
   and the details read returns `images: [{ id, url, isPrimary }]`.

   These are only the endpoints the API itself declares; nothing here creates a
   capability. A module with a multipart update keeps sending its files and
   `RemoveImageIds` in that one request, exactly as before. */
const SEPARATE_IMAGE_ENDPOINTS = {
  "/api/ads": {
    add: (listingId) => `/api/ads/${encodeURIComponent(listingId)}/images`,
    remove: (imageId) => `/api/ads/image/${encodeURIComponent(imageId)}`,
    field: "Images",
  },
};

/** The photo endpoints for a module whose update cannot carry files, or null. */
export function separateImageEndpoints(moduleEndpoint) {
  return SEPARATE_IMAGE_ENDPOINTS[moduleEndpoint] ?? null;
}

/** Newly picked files in the form's photo fields (never server URLs). */
export function newImageFiles(fields = [], values = {}) {
  const isFile = (value) =>
    typeof File !== "undefined" ? value instanceof File : Boolean(value && typeof value === "object" && "name" in value && "size" in value);

  return fields
    .filter((field) => field?.type === "image" && FILE_TYPES.includes(field.type))
    .flatMap((field) => {
      const value = values[field.name];

      return (Array.isArray(value) ? value : [value]).filter(isFile);
    });
}

/** How many photos the listing will have after this save. */
export function photosAfterSave({ existingImages = [], removedIds = new Set(), newFiles = [] }) {
  const kept = existingImages.filter((image) => image?.id && !removedIds.has(image.id)).length;

  return kept + newFiles.length;
}

/**
 * Save a listing whose photos travel separately.
 *
 * Order matters: the text first (that is the save the user asked for and the
 * one whose failure is reported on the form), then the additions, then the
 * removals — so a listing is never left with fewer photos than it should
 * have, even for a moment, because a removal ran before its replacement
 * arrived.
 *
 * Throws only if the text update fails (nothing else has been sent then).
 * Photo failures after a successful update are returned, not swallowed and not
 * hidden: the caller tells the user exactly which part did not go through.
 */
export async function saveListingWithSeparateImages({
  updateEndpoint,
  body,
  listingId,
  endpoints,
  newFiles = [],
  removedIds = [],
  api,
}) {
  const response = await api.update(updateEndpoint, body);

  const failures = [];

  let added = 0;

  if (newFiles.length > 0) {
    try {
      await api.addImages(endpoints.add(listingId), newFiles, endpoints.field);

      added = newFiles.length;
    } catch (error) {
      failures.push({ step: "add", count: newFiles.length, error });
    }
  }

  const removed = [];

  for (const imageId of removedIds) {
    try {
      await api.removeImage(endpoints.remove(imageId));

      removed.push(imageId);
    } catch (error) {
      failures.push({ step: "remove", imageId, error });
    }
  }

  return { response, added, removed, failures };
}

/** One sentence for the user about photo steps that did not go through. */
export function imageFailureText(failures = []) {
  if (failures.length === 0) return null;

  const addFailed = failures.some((failure) => failure.step === "add");

  const removeFailed = failures.filter((failure) => failure.step === "remove").length;

  const parts = [];

  if (addFailed) parts.push("إضافة الصور الجديدة");

  if (removeFailed) parts.push(removeFailed === 1 ? "حذف صورة" : `حذف ${removeFailed} صور`);

  return `تم حفظ بيانات الإعلان، لكن تعذّر ${parts.join(" و")}. حاول مرة أخرى من صفحة التعديل.`;
}
