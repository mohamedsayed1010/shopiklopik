import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { recordOwnerId, resolveListingOwnership } from "../listingOwnership.js";
import { isPermanentClientError, retryUnlessClientError } from "../queryRetry.js";

const OWNER = "5214F08E-358F-4C60-942D-438DC16B38B1";

const STRANGER = "11111111-2222-3333-4444-555555555555";

const httpError = (status) => ({ response: { status } });

describe("resolveListingOwnership — the server's answer wins", () => {
  it("published listing, owner: actions.isOwner true", () => {
    assert.deepEqual(
      resolveListingOwnership({ actions: { isOwner: true }, record: { ownerId: OWNER }, userId: OWNER }),
      { isOwner: true, source: "actions" }
    );
  });

  it("published listing, another reader: an explicit false is never overridden by the record", () => {
    /* Even a record that (wrongly) named this reader cannot reopen it. */
    assert.deepEqual(
      resolveListingOwnership({ actions: { isOwner: false }, record: { ownerId: STRANGER }, userId: STRANGER }),
      { isOwner: false, source: "actions" }
    );
  });
});

describe("resolveListingOwnership — pending listing (actions unavailable)", () => {
  it("the owner is recognised from the record's ownerId", () => {
    assert.deepEqual(
      resolveListingOwnership({ actions: null, record: { ownerId: OWNER }, userId: OWNER.toLowerCase() }),
      { isOwner: true, source: "record" }
    );
  });

  it("the cars DTO names its owner as owner.id", () => {
    assert.equal(
      resolveListingOwnership({ actions: null, record: { owner: { id: OWNER } }, userId: OWNER }).isOwner,
      true
    );
  });

  it("another signed-in reader is not the owner", () => {
    assert.deepEqual(
      resolveListingOwnership({ actions: null, record: { ownerId: OWNER }, userId: STRANGER }),
      { isOwner: false, source: null }
    );
  });

  it("a signed-out reader, or a record without an owner, is never the owner", () => {
    for (const input of [
      { record: { ownerId: OWNER }, userId: null },
      { record: { ownerId: OWNER }, userId: "" },
      { record: {}, userId: OWNER },
      { record: { ownerId: "" }, userId: "" },
      { record: null, userId: OWNER },
      { record: { ownerId: null, owner: null }, userId: OWNER },
    ]) {
      assert.equal(resolveListingOwnership({ actions: null, ...input }).isOwner, false);
    }
  });

  it("actions without a boolean isOwner count as no answer", () => {
    assert.equal(
      resolveListingOwnership({ actions: {}, record: { ownerId: OWNER }, userId: OWNER }).source,
      "record"
    );
  });
});

describe("recordOwnerId", () => {
  it("reads only the published owner fields", () => {
    assert.equal(recordOwnerId({ ownerId: OWNER }), OWNER.toLowerCase());
    assert.equal(recordOwnerId({ owner: { id: OWNER } }), OWNER.toLowerCase());
    assert.equal(recordOwnerId({ userId: OWNER }), null);
    assert.equal(recordOwnerId({ ownerName: "x" }), null);
  });
});

describe("retryUnlessClientError", () => {
  const retry = retryUnlessClientError(1);

  it("does not retry a 404 (pending listing) or any other final 4xx", () => {
    for (const status of [400, 401, 403, 404, 409, 422]) {
      assert.equal(retry(0, httpError(status)), false, String(status));
      assert.equal(isPermanentClientError(httpError(status)), true);
    }
  });

  it("retries a network error, a 5xx, 408 and 429 once", () => {
    for (const error of [new Error("Network Error"), httpError(500), httpError(503), httpError(408), httpError(429)]) {
      assert.equal(retry(0, error), true);
      assert.equal(retry(1, error), false);
    }
  });
});
