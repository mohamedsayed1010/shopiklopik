import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  canOfferReport,
  interactionPolicy,
  moderationFromStatus,
} from "../listingModeration.js";
import {
  imageFailureText,
  newImageFiles,
  photosAfterSave,
  saveListingWithSeparateImages,
  separateImageEndpoints,
} from "../listingImages.js";

/* The owner-only status, as production returns it for a pending test ad. */
const PENDING_STATUS = {
  advertisementModerationStatus: "Pending",
  advertisementModerationStatusName: "قيد المراجعة",
  stage: "NotRequired",
};

describe("moderation status from the API", () => {
  it("reads the server's pending status and its own label", () => {
    assert.deepEqual(moderationFromStatus(PENDING_STATUS), {
      status: "Pending",
      name: "قيد المراجعة",
      isPending: true,
    });
  });

  it("a non-pending status is not pending", () => {
    assert.equal(moderationFromStatus({ advertisementModerationStatus: "Approved" }).isPending, false);
  });

  it("no status, no claim", () => {
    assert.deepEqual(moderationFromStatus(null), { status: null, name: null, isPending: false });
    assert.deepEqual(moderationFromStatus({}), { status: null, name: null, isPending: false });
  });
});

describe("which interactions the details page offers", () => {
  it("someone else's (published) listing: everything, as before", () => {
    assert.deepEqual(interactionPolicy({ isOwnerByRecord: false, statusSettled: false, isPending: false }), {
      askInteractions: true,
      offerFavorite: true,
      offerShare: true,
    });
  });

  it("the owner's pending listing: no published-only requests, no favourite", () => {
    assert.deepEqual(interactionPolicy({ isOwnerByRecord: true, statusSettled: true, isPending: true }), {
      askInteractions: false,
      offerFavorite: false,
      offerShare: false,
    });
  });

  it("the owner, status still loading: requests wait (no 404 in the meantime)", () => {
    assert.equal(interactionPolicy({ isOwnerByRecord: true, statusSettled: false, isPending: false }).askInteractions, false);
  });

  it("the owner's published (or status-unknown) listing: everything, as before", () => {
    assert.deepEqual(interactionPolicy({ isOwnerByRecord: true, statusSettled: true, isPending: false }), {
      askInteractions: true,
      offerFavorite: true,
      offerShare: true,
    });
  });
});

describe("report on one's own listing", () => {
  it("is never offered to the owner — even if the server's actions were missing", () => {
    assert.equal(canOfferReport({ isOwner: true, hasReported: false, actions: null }), false);
    assert.equal(canOfferReport({ isOwner: true, hasReported: false, actions: { canReport: true } }), false);
  });

  it("other readers keep the server's decision, as before", () => {
    assert.equal(canOfferReport({ isOwner: false, hasReported: false, actions: { canReport: true } }), true);
    assert.equal(canOfferReport({ isOwner: false, hasReported: false, actions: { canReport: false } }), false);
    assert.equal(canOfferReport({ isOwner: false, hasReported: false, actions: null }), true);
  });

  it("already reported: not offered again", () => {
    assert.equal(canOfferReport({ isOwner: false, hasReported: true, actions: { canReport: true } }), false);
  });
});

describe("car photos on the edit page", () => {
  const CAR_IMAGES = [
    { id: "img-1", url: "/uploads/ads/a.png", isPrimary: true },
    { id: "img-2", url: "/uploads/ads/b.png", isPrimary: false },
    { id: "img-3", url: "/uploads/ads/c.png", isPrimary: false },
  ];

  const file = (name) => new File(["x"], name, { type: "image/png" });

  it("only cars (`/api/ads`) manage photos through separate endpoints", () => {
    const cars = separateImageEndpoints("/api/ads");

    assert.equal(cars.add("ad-1"), "/api/ads/ad-1/images");
    assert.equal(cars.remove("img-2"), "/api/ads/image/img-2");
    assert.equal(cars.field, "Images");

    assert.equal(separateImageEndpoints("/api/furniture"), null);
    assert.equal(separateImageEndpoints(undefined), null);
  });

  it("new picks are files; server photos (URLs) are never re-sent", () => {
    const fields = [{ name: "Images", type: "image" }, { name: "Title", type: "text" }];

    const picked = [file("new-1.png"), file("new-2.png")];

    assert.deepEqual(
      newImageFiles(fields, { Images: [...picked, "/uploads/ads/a.png"], Title: "x" }).map((f) => f.name),
      ["new-1.png", "new-2.png"]
    );

    assert.deepEqual(newImageFiles(fields, { Images: [] }), []);
  });

  it("counts what will remain: removing one keeps the others", () => {
    assert.equal(photosAfterSave({ existingImages: CAR_IMAGES, removedIds: new Set(["img-2"]), newFiles: [] }), 2);
    assert.equal(photosAfterSave({ existingImages: CAR_IMAGES, removedIds: new Set(), newFiles: [file("n.png")] }), 4);
    assert.equal(
      photosAfterSave({ existingImages: CAR_IMAGES, removedIds: new Set(["img-1", "img-2", "img-3"]), newFiles: [] }),
      0
    );
  });

  function recorder({ failUpdate = false, failAdd = false, failRemove = [] } = {}) {
    const calls = [];

    return {
      calls,
      api: {
        update: async (endpoint, body) => {
          calls.push(["PUT", endpoint, body]);

          if (failUpdate) throw Object.assign(new Error("422"), { response: { status: 422 } });

          return { success: true, message: "تم حفظ التعديلات", data: { status: "Pending" } };
        },
        addImages: async (endpoint, files, field) => {
          calls.push(["POST", endpoint, files.map((f) => f.name), field]);

          if (failAdd) throw new Error("413");
        },
        removeImage: async (endpoint) => {
          calls.push(["DELETE", endpoint]);

          if (failRemove.some((id) => endpoint.endsWith(id))) throw new Error("500");
        },
      },
    };
  }

  const base = {
    updateEndpoint: "/api/ads/ad-1",
    body: { title: "E2E" },
    listingId: "ad-1",
    endpoints: separateImageEndpoints("/api/ads"),
  };

  it("saves text, then adds, then removes — never removing before adding", async () => {
    const r = recorder();

    const result = await saveListingWithSeparateImages({
      ...base,
      newFiles: [file("new-1.png")],
      removedIds: ["img-2"],
      api: r.api,
    });

    assert.deepEqual(
      r.calls.map((call) => `${call[0]} ${call[1]}`),
      ["PUT /api/ads/ad-1", "POST /api/ads/ad-1/images", "DELETE /api/ads/image/img-2"]
    );

    assert.equal(r.calls[1][3], "Images");
    assert.deepEqual(result.failures, []);
    assert.equal(result.added, 1);
    assert.deepEqual(result.removed, ["img-2"]);
  });

  it("with no photo changes only the text is sent (existing photos untouched)", async () => {
    const r = recorder();

    await saveListingWithSeparateImages({ ...base, newFiles: [], removedIds: [], api: r.api });

    assert.deepEqual(r.calls.map((call) => call[0]), ["PUT"]);
  });

  it("removing one photo deletes only that photo", async () => {
    const r = recorder();

    await saveListingWithSeparateImages({ ...base, removedIds: ["img-3"], api: r.api });

    assert.deepEqual(r.calls.filter((call) => call[0] === "DELETE").map((call) => call[1]), ["/api/ads/image/img-3"]);
  });

  it("a rejected text update sends nothing else and is reported on the form", async () => {
    const r = recorder({ failUpdate: true });

    await assert.rejects(
      saveListingWithSeparateImages({ ...base, newFiles: [file("n.png")], removedIds: ["img-1"], api: r.api }),
      (error) => error.response.status === 422
    );

    assert.deepEqual(r.calls.map((call) => call[0]), ["PUT"]);
  });

  it("a failed photo step is reported, not hidden — and the other steps still run", async () => {
    const r = recorder({ failAdd: true, failRemove: ["img-2"] });

    const result = await saveListingWithSeparateImages({
      ...base,
      newFiles: [file("n.png")],
      removedIds: ["img-2", "img-3"],
      api: r.api,
    });

    assert.equal(result.added, 0);
    assert.deepEqual(result.removed, ["img-3"]);
    assert.deepEqual(result.failures.map((f) => f.step), ["add", "remove"]);

    const text = imageFailureText(result.failures);

    assert.match(text, /تم حفظ بيانات الإعلان/);
    assert.match(text, /إضافة الصور الجديدة/);
    assert.match(text, /حذف صورة/);
  });

  it("no failures, no message", () => {
    assert.equal(imageFailureText([]), null);
  });
});
