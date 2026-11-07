import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

/* The authenticated axios instance is replaced by a recorder, so these tests
   check exactly what each service sends and how it reads the answer. */
const calls = [];

let next = () => ({ status: 200, data: { success: true, data: null } });

const record = (method) => async (url, a, b) => {
  const config = method === "get" ? a : b;

  calls.push({ method, url, body: method === "get" ? undefined : a, config });

  const response = await next({ method, url });

  if (response.status >= 400) throw Object.assign(new Error(`HTTP ${response.status}`), { response });

  return response;
};

mock.module("../../../axiosInstance.js", {
  defaultExport: { get: record("get"), put: record("put"), patch: record("patch") },
});

const api = await import("../adminAdPaymentEndpoints.js");

const ID = "ce54a6f7-8081-4f29-80f1-930b676b4880";

beforeEach(() => {
  calls.length = 0;

  next = () => ({ status: 200, data: { success: true, data: null } });
});

describe("admin ad-payment services", () => {
  it("reads and writes settings on /settings", async () => {
    await api.getAdPaymentSettings();

    const body = { isEnabled: true, price: 50, currency: "EGP", instructions: "", paymentMethodIds: [] };

    await api.updateAdPaymentSettings(body);

    assert.deepEqual(calls.map(({ method, url }) => [method, url]), [
      ["get", "/api/v2/admin/ad-payment/settings"],
      ["put", "/api/v2/admin/ad-payment/settings"],
    ]);
    assert.deepEqual(calls[1].body, body);
  });

  it("sends list filters as contract query params", async () => {
    await api.getAdPaymentSubmissions({ status: 1, type: 90, pageIndex: 2, pageSize: 20 });
    await api.getAdPaymentHistory({ categoryId: 14, fromDate: "2026-11-01" });

    assert.equal(calls[0].url, "/api/v2/admin/ad-payment/submissions");
    assert.deepEqual(calls[0].config.params, { Status: 1, Type: 90, PageIndex: 2, PageSize: 20 });
    assert.equal(calls[1].url, "/api/v2/admin/ad-payment/history");
    assert.deepEqual(calls[1].config.params, { CategoryId: 14, FromDate: "2026-11-01T00:00:00", PageIndex: 1, PageSize: 10 });
  });

  it("returns the list envelope untouched (data.items + paging)", async () => {
    const page = { items: [{ paymentSubmissionId: ID }], pageIndex: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false };

    next = () => ({ status: 200, data: { success: true, data: page } });

    const response = await api.getAdPaymentSubmissions({});

    assert.deepEqual(response.data, page);
  });

  it("PATCHes the review body to the submission's own id", async () => {
    const body = { decision: "Approve", rejectionReason: "", feedback: "" };

    await api.reviewAdPaymentSubmission({ paymentSubmissionId: ID, body });

    assert.equal(calls[0].method, "patch");
    assert.equal(calls[0].url, `/api/v2/admin/ad-payment/submissions/${ID}/review`);
    assert.deepEqual(calls[0].body, body);
  });

  it("surfaces a 409 with the server's message", async () => {
    next = () => ({ status: 409, data: { success: false, message: "تمت مراجعة هذا الطلب بالفعل." } });

    await assert.rejects(
      api.reviewAdPaymentSubmission({ paymentSubmissionId: ID, body: { decision: "Reject", rejectionReason: "x", feedback: "" } }),
      (error) => error.response.status === 409 && error.response.data.message.includes("بالفعل")
    );
  });

  it("loads the screenshot as an authenticated blob", async () => {
    const image = new Blob(["jpeg"], { type: "image/jpeg" });

    next = () => ({ status: 200, data: image });

    const blob = await api.getAdPaymentSubmissionScreenshot(ID);

    assert.equal(blob, image);
    assert.equal(calls[0].url, `/api/v2/admin/ad-payment/submissions/${ID}/screenshot`);
    assert.equal(calls[0].config.responseType, "blob");
  });

  it("decodes a JSON 404 that arrived as a blob", async () => {
    next = () => ({ status: 404, data: new Blob([JSON.stringify({ success: false, message: "عملية الدفع غير موجودة." })], { type: "application/json" }) });

    await assert.rejects(api.getAdPaymentSubmissionScreenshot(ID), (error) => error.response.data.message === "عملية الدفع غير موجودة.");
  });

  it("treats a 200 that is not an image as a failure", async () => {
    next = () => ({ status: 200, data: new Blob(["<html>"], { type: "text/html" }) });

    await assert.rejects(api.getAdPaymentSubmissionScreenshot(ID), (error) => error.notAnImage === true);
  });
});
