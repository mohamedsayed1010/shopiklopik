import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

/* Profile / payments hooks called as plain functions; React Query is a
   recorder. Each test reads which keys are queried, which are invalidated, and
   what reaches the session. */

const queries = [];

let mutationOptions = [];

const invalidated = [];

const cacheWrites = [];

const patched = [];

let context = { patchUser: (user) => patched.push(user) };

mock.module("react", {
  namedExports: {
    useContext: () => context,
    useMemo: (factory) => factory(),
    useCallback: (callback) => callback,
    useState: (value) => [typeof value === "function" ? value() : value, () => {}],
    createContext: () => ({}),
  },
});

mock.module("../../context/AuthContext.jsx", { namedExports: { AuthContext: {} } });

mock.module("@tanstack/react-query", {
  namedExports: {
    useQuery: (options) => {
      queries.push(options);

      return { data: undefined, isLoading: false, isFetching: false, isError: false };
    },
    useMutation: (options) => {
      mutationOptions.push(options);

      return { mutate() {}, mutateAsync: async () => {} };
    },
    useQueryClient: () => ({
      invalidateQueries: (filter) => invalidated.push(JSON.stringify(filter.queryKey)),
      setQueryData: (key) => cacheWrites.push(JSON.stringify(key)),
      getQueryData: () => undefined,
    }),
  },
});

mock.module("react-hot-toast", {
  defaultExport: Object.assign(() => {}, { success() {}, error() {} }),
});

const offline = async () => {
  throw new Error("network disabled in tests");
};

mock.module("../../api/axiosInstance.js", {
  defaultExport: { get: offline, post: offline, put: offline, patch: offline, delete: offline },
  namedExports: { API_BASE_URL: "https://api.test/" },
});

const { useMyPayments, myPaymentsKey, MY_PAYMENTS_LIST_ROOT } = await import("../usePayments.js");
const { default: useUpdateProfile } = await import("../../pages/Profile/updateprofile/useUpdateProfile.js");
const { default: useProfileImage } = await import("../../pages/Profile/useProfileImage.js");

const USER = { id: "21467f80-0000", firstName: "E2E", secondName: "Updated", email: "e2e@example.com" };

beforeEach(() => {
  queries.length = 0;
  mutationOptions = [];
  invalidated.length = 0;
  cacheWrites.length = 0;
  patched.length = 0;
  context = { patchUser: (user) => patched.push(user) };
});

describe("payments page — one logical query", () => {
  it("the page's two calls (empty select + unfiltered) share one key, so one request", () => {
    useMyPayments({ status: "" });
    useMyPayments({});

    const keys = queries.map((query) => JSON.stringify(query.queryKey));

    assert.equal(new Set(keys).size, 1);
    assert.deepEqual(queries[0].queryKey, [...MY_PAYMENTS_LIST_ROOT, "all"]);
  });

  it("choosing a status adds exactly one other query (the options list keeps the unfiltered one)", () => {
    useMyPayments({ status: "2" });
    useMyPayments({});

    assert.equal(new Set(queries.map((query) => JSON.stringify(query.queryKey))).size, 2);
  });

  it("every payments key sits under the root that a new payment invalidates", () => {
    assert.deepEqual(myPaymentsKey("1").slice(0, 2), MY_PAYMENTS_LIST_ROOT);
  });
});

describe("profile edits reach the session (navbar) and only the profile caches", () => {
  it("a profile update patches the signed-in user and invalidates the profile only", () => {
    useUpdateProfile();

    mutationOptions[0].onSuccess({ success: true, message: "تم", data: USER });

    assert.deepEqual(patched, [USER], "the navbar's name/e-mail come from here");
    assert.deepEqual(invalidated, [JSON.stringify(["profile"])]);
    assert.ok(cacheWrites.includes(JSON.stringify(["profile"])));
  });

  it("a new photo does the same", () => {
    useProfileImage();

    mutationOptions[0].onSuccess({ success: true, data: { ...USER, profileImageUrl: "/uploads/u.png" } });

    assert.equal(patched.length, 1);
    assert.equal(patched[0].profileImageUrl, "/uploads/u.png");
    assert.deepEqual(invalidated, [JSON.stringify(["profile"])]);
  });

  it("without a session context it still keeps storage in step (no crash)", () => {
    context = {};

    const storage = new Map();

    globalThis.localStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    };

    useUpdateProfile();

    mutationOptions[0].onSuccess({ success: true, data: USER });

    assert.equal(JSON.parse(storage.get("user")).secondName, "Updated");

    delete globalThis.localStorage;
  });
});
