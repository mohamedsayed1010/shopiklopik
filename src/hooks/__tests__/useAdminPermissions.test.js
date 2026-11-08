import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

/* Calls the hooks as plain functions: React's hooks and `useQuery` are
   replaced, so each test reads exactly what `useMyAdminPermissions` hands to
   React Query and what `useAdminAccess` decides from the answer. */

function jwt(claims) {
  const encode = (value) =>
    btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${encode({ alg: "HS256" })}.${encode(claims)}.signature`;
}

const store = new Map();

globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

let session = { token: null, isAdmin: false };

/* Per query key: the options received and the answer to give back. */
const queries = new Map();

const answers = new Map();

let requests = 0;

mock.module("react", {
  namedExports: {
    useContext: () => session,
    useMemo: (factory) => factory(),
    useCallback: (callback) => callback,
    createContext: () => ({}),
  },
});

mock.module("../../context/AuthContext.jsx", { namedExports: { AuthContext: {} } });

/* Nothing in this suite may reach the network: every service the import graph
   pulls in gets a client that refuses. */
const offline = async () => {
  throw new Error("network disabled in tests");
};

mock.module("../../api/axiosInstance.js", {
  defaultExport: { get: offline, post: offline, put: offline, patch: offline, delete: offline },
  namedExports: { API_BASE_URL: "https://api.test/" },
});

mock.module("@tanstack/react-query", {
  namedExports: {
    /* Imported (unused here) by `useAdminAuditLogs`, the home of `adminRetry`. */
    keepPreviousData: (previous) => previous,
    useQuery: (options) => {
      const key = JSON.stringify(options.queryKey);

      queries.set(key, options);

      const data = answers.get(key);

      return {
        data,
        isLoading: options.enabled !== false && data === undefined,
        isError: false,
      };
    },
  },
});

mock.module("../../api/admin/permissions/adminPermissionsEndpoints.js", {
  namedExports: {
    getMyAdminPermissions: async () => {
      requests += 1;

      return nextResponse();
    },
    getAdminPermissionPages: async () => ({ data: [] }),
  },
});

let nextResponse = async () => ({});

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

const {
  default: useAdminAccess,
  useMyAdminPermissions,
  myAdminPermissionsKey,
} = await import("../admin/useAdminPermissions.js");

const { ADMIN_ACCESS_DENIED } = await import("../../utils/adminDenial.js");

const meKey = (subject) => JSON.stringify(myAdminPermissionsKey(subject));

/** Run the query function the hook registered, as React Query would. */
async function resolveMe(subject) {
  const options = queries.get(meKey(subject));

  const data = await options.queryFn();

  answers.set(meKey(subject), data);

  return data;
}

const staleTimeOf = (subject) =>
  queries.get(meKey(subject)).staleTime({ state: { data: answers.get(meKey(subject)) } });

beforeEach(() => {
  store.clear();
  queries.clear();
  answers.clear();
  requests = 0;
});

describe("regular user", () => {
  beforeEach(() => {
    session = { token: jwt({ sub: "user-1", jti: "session-a" }), isAdmin: false };

    nextResponse = async () => {
      throw httpError(403);
    };
  });

  it("asks once, and the 403 becomes a cached refusal held for the session", async () => {
    useMyAdminPermissions();

    assert.equal(queries.get(meKey("user-1")).enabled, true);
    assert.equal(await resolveMe("user-1"), ADMIN_ACCESS_DENIED);
    assert.equal(requests, 1);

    /* Infinity: no refetch on focus or remount while this session lasts. */
    assert.equal(staleTimeOf("user-1"), Infinity);
  });

  it("does not ask again after a reload of the same session", async () => {
    useMyAdminPermissions();
    await resolveMe("user-1");

    // A reload: the cache is gone, the remembered refusal is not.
    queries.clear();
    answers.clear();

    const { query, resolved } = useMyAdminPermissions();

    assert.equal(queries.get(meKey("user-1")).enabled, false);
    assert.equal(query.isLoading, false);
    assert.equal(resolved, false);
    assert.equal(requests, 1);
  });

  it("asks again after a new sign-in", async () => {
    useMyAdminPermissions();
    await resolveMe("user-1");

    session = { token: jwt({ sub: "user-1", jti: "session-b" }), isAdmin: false };
    queries.clear();
    answers.clear();

    useMyAdminPermissions();

    assert.equal(queries.get(meKey("user-1")).enabled, true);
  });

  it("gets no admin access — before, during and after the refusal", async () => {
    let access = useAdminAccess();

    assert.equal(access.isAdmin, false);
    assert.equal(access.canOpenRoute("/admin"), false);

    await resolveMe("user-1");

    access = useAdminAccess();

    assert.equal(access.isAdmin, false);
    assert.equal(access.resolved, false);
    assert.equal(access.isLoading, false);
    assert.equal(access.canOpenRoute("/admin"), false);
    assert.equal(access.canOpenRoute("/admin/ads"), false);
    assert.equal(access.canOnRoute("/admin/ads", "view"), false);
  });

  it("a network failure is not remembered as a refusal and grants nothing", async () => {
    nextResponse = async () => {
      throw new Error("Network Error");
    };

    useMyAdminPermissions();

    await assert.rejects(queries.get(meKey("user-1")).queryFn());

    assert.equal(store.size, 0);
    assert.equal(useAdminAccess().isAdmin, false);
  });

  it("is never asked while signed out", () => {
    session = { token: null, isAdmin: false };

    useMyAdminPermissions();

    assert.equal(queries.get(meKey("")).enabled, false);
  });
});

describe("administrator", () => {
  const grants = {
    success: true,
    data: {
      admin: { isSuperAdmin: false },
      pages: [{ pageKey: "ads", route: "/admin/ads", permissions: ["view"] }],
    },
  };

  beforeEach(() => {
    session = { token: jwt({ sub: "admin-1", jti: "session-x" }), isAdmin: false };

    nextResponse = async () => grants;
  });

  it("still loads the grants, with the usual five-minute freshness", async () => {
    useMyAdminPermissions();

    assert.equal(queries.get(meKey("admin-1")).enabled, true);
    assert.equal(await resolveMe("admin-1"), grants);
    assert.equal(staleTimeOf("admin-1"), 1000 * 60 * 5);
    assert.equal(store.size, 0);
  });

  it("keeps admin access from the server's answer", async () => {
    useAdminAccess();
    await resolveMe("admin-1");

    const access = useAdminAccess();

    assert.equal(access.isAdmin, true);
    assert.equal(access.resolved, true);
    assert.equal(access.canOpenRoute("/admin"), true);
  });

  it("is asked again on every reload — nothing is remembered for an admin", async () => {
    useMyAdminPermissions();
    await resolveMe("admin-1");

    queries.clear();
    answers.clear();

    useMyAdminPermissions();

    assert.equal(queries.get(meKey("admin-1")).enabled, true);
  });

  it("an admin whose stored marker belongs to another session is still asked", () => {
    store.set("adminAccessDenied", "admin-1:some-older-session");

    useMyAdminPermissions();

    assert.equal(queries.get(meKey("admin-1")).enabled, true);
  });
});
