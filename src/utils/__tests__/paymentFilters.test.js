import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { myPaymentsParams, normalizePaymentStatus } from "../paymentFilters.js";

/* `usePayments` imports the authenticated instance through `payments.js`; a
   recorder stands in for it so the request params can be read back. */
const calls = [];

mock.module("../../api/axiosInstance.js", {
  defaultExport: {
    get: async (url, config) => {
      calls.push({ url, config });

      return { status: 200, data: { success: true, data: [] } };
    },
  },
});

const { myPaymentsKey, MY_PAYMENTS_LIST_ROOT } = await import("../../hooks/usePayments.js");
const { getMyPayments } = await import("../../api/payments/payments.js");

const key = (status) => JSON.stringify(myPaymentsKey(status));

describe("normalizePaymentStatus", () => {
  it("reads every spelling of 'no filter' as null", () => {
    for (const value of [undefined, null, "", "   ", "all", "ALL", "abc", NaN]) {
      assert.equal(normalizePaymentStatus(value), null, String(value));
    }
  });

  it("reads a status from a select and from code as the same number", () => {
    assert.equal(normalizePaymentStatus("2"), 2);
    assert.equal(normalizePaymentStatus(2), 2);
    assert.equal(normalizePaymentStatus(" 3 "), 3);
  });

  it("keeps 0 as a real filter, not as 'no filter'", () => {
    assert.equal(normalizePaymentStatus(0), 0);
    assert.equal(normalizePaymentStatus("0"), 0);
  });
});

describe("myPaymentsKey", () => {
  it("gives the empty, omitted and default status one cache entry", () => {
    const unfiltered = key(undefined);

    assert.equal(key(""), unfiltered);
    assert.equal(key(null), unfiltered);
    assert.equal(key("all"), unfiltered);
    assert.deepEqual(myPaymentsKey(""), [...MY_PAYMENTS_LIST_ROOT, "all"]);
  });

  it("keeps different filters apart", () => {
    assert.notEqual(key("1"), key("2"));
    assert.notEqual(key("1"), key(""));
    assert.notEqual(key(0), key(""));
  });

  it("gives the same filter one entry whatever its type", () => {
    assert.equal(key("2"), key(2));
  });

  it("stays under the list root that mutations invalidate", () => {
    assert.deepEqual(myPaymentsKey(2).slice(0, MY_PAYMENTS_LIST_ROOT.length), MY_PAYMENTS_LIST_ROOT);
  });
});

describe("getMyPayments", () => {
  it("sends the same request for every key it shares", async () => {
    calls.length = 0;

    for (const status of [undefined, "", null, "all"]) await getMyPayments({ status });

    await getMyPayments();

    assert.equal(calls.length, 5);

    for (const call of calls) {
      assert.equal(call.url, "/api/payments/my");
      assert.deepEqual(call.config.params, {});
    }
  });

  it("sends an explicit status as a number", async () => {
    calls.length = 0;

    await getMyPayments({ status: "2" });
    await getMyPayments({ status: 0 });

    assert.deepEqual(calls.map((call) => call.config.params), [{ status: 2 }, { status: 0 }]);
  });

  it("agrees with the key: one key, one set of params", () => {
    for (const status of [undefined, "", "all", "1", 1, 0]) {
      const fromKey = myPaymentsKey(status).at(-1);

      const params = myPaymentsParams(status);

      assert.deepEqual(params, fromKey === "all" ? {} : { status: fromKey });
    }
  });
});
