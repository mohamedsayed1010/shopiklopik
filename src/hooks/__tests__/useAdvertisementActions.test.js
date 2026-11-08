import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

/* No renderer in this suite: `useQuery` is replaced by a recorder, so calling
   the hook as a plain function exposes exactly the options it hands to React
   Query. The module-type lookup is stubbed as already resolved. */
let captured = null;

let answer = { data: undefined, isPending: false };

mock.module("@tanstack/react-query", {
  namedExports: {
    useQuery: (options) => {
      captured = options;

      return { isFetching: false, isError: false, error: null, refetch() {}, ...answer };
    },
  },
});

mock.module("../useListingModuleType.js", {
  defaultExport: () => ({ type: 81, isResolved: true }),
});

mock.module("../../api/advertisements/interactions.js", {
  namedExports: { getAdvertisementActions: async () => ({}) },
});

const { default: useAdvertisementActions } = await import("../useAdvertisementActions.js");

const ID = "169ec674-18cd-49b5-8a0a-09dd45dde9b8";

describe("useAdvertisementActions", () => {
  it("does not retry the 404 a pending listing answers", () => {
    useAdvertisementActions({ id: ID, type: 81 });

    assert.equal(captured.retry(0, { response: { status: 404 } }), false);
  });

  it("still retries a network failure or a 5xx once", () => {
    useAdvertisementActions({ id: ID, type: 81 });

    assert.equal(captured.retry(0, new Error("Network Error")), true);
    assert.equal(captured.retry(0, { response: { status: 502 } }), true);
    assert.equal(captured.retry(1, { response: { status: 502 } }), false);
  });

  it("reports no actions — not invented ones — after a 404", () => {
    answer = { data: undefined, isPending: false, isError: true, error: { response: { status: 404 } } };

    const result = useAdvertisementActions({ id: ID, type: 81 });

    assert.equal(result.actions, null);
    assert.equal(result.isLoading, false);
    assert.equal(result.isError, true);
  });

  it("passes a published listing's server answer through unchanged", () => {
    const actions = { isOwner: false, canReport: true, isFavorite: true };

    answer = { data: { data: actions }, isPending: false };

    assert.deepEqual(useAdvertisementActions({ id: ID, type: 81 }).actions, actions);
  });
});
