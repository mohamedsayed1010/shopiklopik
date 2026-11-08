import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_ACCESS_DENIED,
  ADMIN_DENIAL_STORAGE_KEY,
  adminDenialMarker,
  isAdminAccessDenied,
  isKnownAdminDenial,
  readAdminPermissions,
} from "../adminDenial.js";
import { normalizeMyPermissions } from "../adminPermissions.js";

function jwt(claims) {
  const encode = (value) =>
    btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${encode({ alg: "HS256" })}.${encode(claims)}.signature`;
}

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));

  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    map,
  };
}

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

const USER = jwt({ sub: "user-1", jti: "session-a" });

const ADMIN_GRANTS = { success: true, data: { admin: { isSuperAdmin: false }, pages: [{ pageKey: "ads", permissions: ["view"] }] } };

describe("adminDenialMarker", () => {
  it("is the session's sub and jti", () => {
    assert.equal(adminDenialMarker(USER), "user-1:session-a");
  });

  it("reads the nameidentifier claim when there is no sub", () => {
    const token = jwt({
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "user-9",
      jti: "s",
    });

    assert.equal(adminDenialMarker(token), "user-9:s");
  });

  it("is null when either half is missing, so nothing is remembered", () => {
    assert.equal(adminDenialMarker(jwt({ sub: "user-1" })), null);
    assert.equal(adminDenialMarker(jwt({ jti: "x" })), null);
    assert.equal(adminDenialMarker(null), null);
    assert.equal(adminDenialMarker("not-a-jwt"), null);
  });

  it("changes on a new sign-in (new jti)", () => {
    assert.notEqual(adminDenialMarker(USER), adminDenialMarker(jwt({ sub: "user-1", jti: "session-b" })));
  });
});

describe("readAdminPermissions — regular user", () => {
  it("turns the 403 into the denial answer and remembers this session", async () => {
    const storage = memoryStorage();

    const result = await readAdminPermissions(() => Promise.reject(httpError(403)), "user-1:session-a", storage);

    assert.equal(result, ADMIN_ACCESS_DENIED);
    assert.equal(isAdminAccessDenied(result), true);
    assert.equal(storage.map.get(ADMIN_DENIAL_STORAGE_KEY), "user-1:session-a");
    assert.equal(isKnownAdminDenial("user-1:session-a", storage), true);
  });

  it("the denial grants nothing", () => {
    assert.deepEqual(normalizeMyPermissions(ADMIN_ACCESS_DENIED), {
      resolved: false,
      isSuperAdmin: false,
      admin: null,
      pages: [],
    });
  });

  it("a remembered denial does not cover another session or account", () => {
    const storage = memoryStorage({ [ADMIN_DENIAL_STORAGE_KEY]: "user-1:session-a" });

    assert.equal(isKnownAdminDenial("user-1:session-b", storage), false);
    assert.equal(isKnownAdminDenial("user-2:session-a", storage), false);
    assert.equal(isKnownAdminDenial(null, storage), false);
  });
});

describe("readAdminPermissions — failures that are not a refusal", () => {
  for (const status of [401, 404, 429, 500, 503]) {
    it(`rethrows ${status} and remembers nothing`, async () => {
      const storage = memoryStorage();

      await assert.rejects(
        readAdminPermissions(() => Promise.reject(httpError(status)), "user-1:session-a", storage),
        (error) => error.response.status === status
      );

      assert.equal(storage.map.size, 0);
    });
  }

  it("rethrows a network error and remembers nothing", async () => {
    const storage = memoryStorage();

    await assert.rejects(readAdminPermissions(() => Promise.reject(new Error("Network Error")), "m", storage));

    assert.equal(storage.map.size, 0);
  });
});

describe("readAdminPermissions — administrator", () => {
  it("returns the server's grants untouched and remembers nothing", async () => {
    const storage = memoryStorage();

    const result = await readAdminPermissions(() => Promise.resolve(ADMIN_GRANTS), "admin-1:s", storage);

    assert.equal(result, ADMIN_GRANTS);
    assert.equal(isAdminAccessDenied(result), false);
    assert.equal(storage.map.size, 0);
    assert.equal(normalizeMyPermissions(result).resolved, true);
  });
});

describe("storage that cannot be used", () => {
  it("unreadable storage means asking the server", () => {
    const broken = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };

    assert.equal(isKnownAdminDenial("user-1:session-a", broken), false);
  });

  it("unwritable storage still answers with the denial", async () => {
    const broken = { getItem: () => null, setItem() { throw new Error("quota"); } };

    assert.equal(
      await readAdminPermissions(() => Promise.reject(httpError(403)), "m", broken),
      ADMIN_ACCESS_DENIED
    );
  });
});
