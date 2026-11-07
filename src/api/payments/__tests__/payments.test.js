import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

/* The legacy user payments service (`/api/payments`). The authenticated axios
   instance is replaced by a recorder. */
const calls = [];

let next = () => ({ status: 200, data: null });

mock.module("../../axiosInstance.js", {
  defaultExport: {
    get: async (url, config) => {
      calls.push({ url, config });

      const response = await next();

      if (response.status >= 400) throw Object.assign(new Error(`HTTP ${response.status}`), { response });

      return response;
    },
  },
});

const { getPaymentDetails, getPaymentScreenshot } = await import("../payments.js");

const ID = "d0dc7e2a-7f34-4088-a555-6155016d1435";

const PATH = `/api/payments/${ID}/screenshot`;

beforeEach(() => {
  calls.length = 0;
});

describe("getPaymentScreenshot", () => {
  it("loads the receipt through the authenticated client as a blob", async () => {
    const image = new Blob(["jpeg"], { type: "image/jpeg" });

    next = () => ({ status: 200, data: image });

    assert.equal(await getPaymentScreenshot(PATH), image);
    assert.equal(calls[0].url, PATH);
    assert.equal(calls[0].config.responseType, "blob");
  });

  it("decodes a JSON error that arrived as a blob", async () => {
    next = () => ({
      status: 401,
      data: new Blob([JSON.stringify({ success: false, message: "Unauthorized" })], { type: "application/json" }),
    });

    await assert.rejects(getPaymentScreenshot(PATH), (error) => error.response.status === 401 && error.response.data.message === "Unauthorized");
  });

  it("treats a 200 that is not an image as a failure", async () => {
    next = () => ({ status: 200, data: new Blob(["<html>"], { type: "text/html" }) });

    await assert.rejects(getPaymentScreenshot(PATH), (error) => error.notAnImage === true);
  });

  it("treats an empty image as a failure", async () => {
    next = () => ({ status: 200, data: new Blob([], { type: "image/jpeg" }) });

    await assert.rejects(getPaymentScreenshot(PATH), (error) => error.notAnImage === true);
  });
});

describe("getPaymentDetails", () => {
  it("reads one payment from /api/payments/{id}", async () => {
    next = () => ({ status: 200, data: { success: true, data: { id: ID, screenshotUrl: PATH } } });

    const response = await getPaymentDetails(ID);

    assert.equal(calls[0].url, `/api/payments/${ID}`);
    assert.equal(response.data.screenshotUrl, PATH);
  });
});
