import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  REVIEW_DECISION_VALUES,
  adPaymentErrorCopy,
  dateRangeError,
  isAwaitingReview,
  isImageBlob,
  isOwnSubmission,
  isReviewContractKnown,
  isSettingsDirty,
  parseReviewResult,
  readBlobJson,
  rejectionReasonError,
  reviewFeedbackOf,
  settingsToForm,
  toAdPaymentListParams,
  toReviewPayload,
  toSettingsPayload,
  validateSettingsForm,
} from "../adPayment.js";

const UUID = "ce54a6f7-8081-4f29-80f1-930b676b4880";

const httpError = (status, data) => ({ response: { status, data } });

describe("toAdPaymentListParams", () => {
  it("sends every documented filter under its contract name", () => {
    assert.deepEqual(
      toAdPaymentListParams({
        status: "1",
        type: 90,
        categoryId: "14",
        userId: " 8a36cb9d-d0c9-414b-b0c9-a8d1759c1f45 ",
        advertisementId: UUID,
        fromDate: "2026-11-01",
        toDate: "2026-11-07",
        pageIndex: 2,
        pageSize: 20,
        isPageIndexOutOfRange: false,
      }),
      {
        Status: 1,
        Type: 90,
        CategoryId: 14,
        UserId: "8a36cb9d-d0c9-414b-b0c9-a8d1759c1f45",
        AdvertisementId: UUID,
        FromDate: "2026-11-01T00:00:00",
        ToDate: "2026-11-07T23:59:59",
        PageIndex: 2,
        PageSize: 20,
        IsPageIndexOutOfRange: false,
      }
    );
  });

  it("defaults paging and drops empty or invalid values", () => {
    assert.deepEqual(
      toAdPaymentListParams({ status: 9, type: 999, advertisementId: "nope", fromDate: "x", userId: "  " }),
      { PageIndex: 1, PageSize: 10 }
    );
  });

  it("caps PageSize at the server's 50 and keeps CategoryId 0", () => {
    const params = toAdPaymentListParams({ pageSize: 500, pageIndex: 0, categoryId: 0 });

    assert.equal(params.PageSize, 50);
    assert.equal(params.PageIndex, 1);
    assert.equal(params.CategoryId, 0);
  });

  it("lets filters combine independently", () => {
    assert.deepEqual(toAdPaymentListParams({ status: 2 }), { Status: 2, PageIndex: 1, PageSize: 10 });
    assert.deepEqual(toAdPaymentListParams({ type: 36, categoryId: 9 }), { Type: 36, CategoryId: 9, PageIndex: 1, PageSize: 10 });
  });

  it("flags a reversed date range before it is sent", () => {
    assert.ok(dateRangeError("2026-11-07", "2026-11-01"));
    assert.equal(dateRangeError("2026-11-01", "2026-11-01"), null);
    assert.equal(dateRangeError("", "2026-11-01"), null);
  });
});

describe("settings", () => {
  const settings = {
    isEnabled: true,
    isProtected: false,
    scope: "Global",
    categoryId: null,
    price: 50,
    currency: "EGP",
    instructions: "دفع",
    paymentMethodIds: [],
    usesAllActiveMethods: true,
    paymentMethods: [{ id: 1 }],
    updatedAt: "2026-11-06T16:40:17",
    updatedByName: "System Admin",
  };

  it("reads [] + usesAllActiveMethods as 'all active methods'", () => {
    const form = settingsToForm(settings);

    assert.equal(form.methodsMode, "all");
    assert.deepEqual(form.paymentMethodIds, []);
    assert.equal(form.price, "50");
  });

  it("PUT body holds exactly the five writable fields", () => {
    const body = toSettingsPayload({ ...settingsToForm(settings), methodsMode: "selected", paymentMethodIds: [2, 2, 3] });

    assert.deepEqual(Object.keys(body).sort(), ["currency", "instructions", "isEnabled", "paymentMethodIds", "price"]);
    assert.deepEqual(body.paymentMethodIds, [2, 3]);
    assert.equal(body.price, 50);
  });

  it("never sends backend-controlled fields", () => {
    const body = toSettingsPayload({ ...settings, methodsMode: "all" });

    for (const key of ["scope", "categoryId", "isProtected", "usesAllActiveMethods", "paymentMethods", "updatedAt"]) {
      assert.equal(key in body, false, key);
    }

    assert.deepEqual(body.paymentMethodIds, []);
  });

  it("validates price, currency and a selected-methods list", () => {
    const errors = validateSettingsForm({ price: "-1", currency: " ", methodsMode: "selected", paymentMethodIds: [] });

    assert.ok(errors.price);
    assert.ok(errors.currency);
    assert.ok(errors.paymentMethodIds);
    assert.deepEqual(validateSettingsForm(settingsToForm(settings)), {});
  });

  it("detects a changed form", () => {
    const initial = settingsToForm(settings);

    assert.equal(isSettingsDirty(initial, initial), false);
    assert.equal(isSettingsDirty({ ...initial, price: "60" }, initial), true);
  });
});

describe("review", () => {
  it("uses the server-validated decision values", () => {
    assert.deepEqual(REVIEW_DECISION_VALUES, { approve: "Approve", reject: "Reject" });
    assert.equal(isReviewContractKnown(), true);
  });

  it("approve sends an empty reason and the optional feedback", () => {
    assert.deepEqual(toReviewPayload({ action: "approve", rejectionReason: "leftover" }), {
      decision: "Approve",
      rejectionReason: "",
      feedback: "",
    });

    assert.deepEqual(toReviewPayload({ action: "approve", feedback: "  شكرًا  " }), {
      decision: "Approve",
      rejectionReason: "",
      feedback: "شكرًا",
    });
  });

  it("reject requires a reason and sends it verbatim", () => {
    assert.equal(toReviewPayload({ action: "reject", rejectionReason: "   " }), null);
    assert.ok(rejectionReasonError(""));

    assert.deepEqual(toReviewPayload({ action: "reject", rejectionReason: " الإيصال غير واضح ", feedback: "أعد الرفع" }), {
      decision: "Reject",
      rejectionReason: " الإيصال غير واضح ",
      feedback: "أعد الرفع",
    });
  });

  it("refuses unknown actions and missing decision values", () => {
    assert.equal(toReviewPayload({ action: "publish" }), null);
    assert.equal(toReviewPayload({ action: "approve" }, { approve: "", reject: "Reject" }), null);
  });

  it("offers review only on undecided records", () => {
    assert.equal(isAwaitingReview({ paymentStatus: 1 }), true);
    assert.equal(isAwaitingReview({ reviewedAt: "2026-11-07T10:00:00" }), false);
    assert.equal(isAwaitingReview({ consumedAt: "2026-11-07T10:00:00" }), false);
    assert.equal(isAwaitingReview({ rejectionReason: "x" }), false);
    assert.equal(isAwaitingReview(null), false);
  });

  it("parses the listing outcome the server returns", () => {
    const result = parseReviewResult({
      success: true,
      data: {
        payment: { paymentSubmissionId: UUID, paymentStatus: 2 },
        listingAction: " SentToModeration ",
        listingActionName: "أُرسل للمراجعة",
        listingModerationStatus: "Pending",
      },
    });

    assert.equal(result.payment.paymentSubmissionId, UUID);
    assert.equal(result.listingAction, "SentToModeration");
    assert.equal(result.listingModerationStatus, "Pending");
    assert.equal(parseReviewResult({ data: null }), null);
  });

  it("reads the reviewer's note under either field name", () => {
    assert.equal(reviewFeedbackOf({ feedback: " a " }), "a");
    assert.equal(reviewFeedbackOf({ reviewFeedback: "b" }), "b");
    assert.equal(reviewFeedbackOf({ feedback: "  " }), null);
    assert.equal(reviewFeedbackOf(null), null);
  });
});

describe("adPaymentErrorCopy", () => {
  it("shows the server's own message for 400, 404, 409 and 422", () => {
    for (const status of [400, 404, 409, 422]) {
      const copy = adPaymentErrorCopy(httpError(status, { success: false, message: `server-${status}` }));

      assert.equal(copy.status, status);
      assert.equal(copy.description, `server-${status}`);
    }
  });

  it("has fixed copy for 401, 429 and 5xx", () => {
    for (const status of [401, 429, 500, 503]) {
      const copy = adPaymentErrorCopy(httpError(status, { message: "internal detail" }));

      assert.equal(copy.status, status);
      assert.ok(copy.title);
      assert.equal(copy.description.includes("internal detail"), false);
    }
  });

  it("distinguishes a network failure", () => {
    assert.equal(adPaymentErrorCopy(new Error("Network Error")).status, null);
  });
});

describe("screenshot helpers", () => {
  it("accepts only non-empty images", () => {
    assert.equal(isImageBlob(new Blob(["x"], { type: "image/jpeg" })), true);
    assert.equal(isImageBlob(new Blob([], { type: "image/jpeg" })), false);
    assert.equal(isImageBlob(new Blob(["{}"], { type: "application/json" })), false);
  });

  it("decodes a JSON error body that arrived as a Blob", async () => {
    const body = { success: false, message: "عملية الدفع غير موجودة." };

    assert.deepEqual(await readBlobJson(new Blob([JSON.stringify(body)], { type: "application/json" })), body);
    assert.equal(await readBlobJson(new Blob(["<html>"])), null);
  });
});

describe("self-review", () => {
  const admin = "8a36cb9d-d0c9-414b-b0c9-a8d1759c1f45";

  it("recognises the admin's own payment, case-insensitively", () => {
    assert.equal(isOwnSubmission({ ownerId: admin.toUpperCase() }, admin), true);
    assert.equal(isOwnSubmission({ ownerId: "other" }, admin), false);
  });

  it("never blocks when either id is unknown", () => {
    assert.equal(isOwnSubmission({ ownerId: admin }, null), false);
    assert.equal(isOwnSubmission({}, admin), false);
  });

  it("shows the server's 403 reason instead of a generic permission text", () => {
    const copy = adPaymentErrorCopy(httpError(403, { success: false, message: "مينفعش تراجع عملية دفع إنت اللي دافعها." }));

    assert.equal(copy.description, "مينفعش تراجع عملية دفع إنت اللي دافعها.");
    assert.ok(adPaymentErrorCopy(httpError(403, {})).description.includes("صلاحية"));
  });
});
