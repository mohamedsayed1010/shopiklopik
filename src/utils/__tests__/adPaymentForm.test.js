import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildPaymentFormData,
  createdAdvertisementId,
  fillPaymentEndpoint,
  paymentGate,
  paymentTarget,
  userPaymentFields,
} from "../adPaymentForm.js";

/* The Lookup payment block as `GET /api/lookups/create-ad-form/14/59` returned
   it on 2026-11-07 (field list trimmed to what the rules read). */
const lookup = {
  payment: {
    isSubjectToPayment: true,
    advertisementType: 90,
    configEndpoint: "/api/v2/ad-payment/config",
    submitEndpoint: "/api/v2/ads/{advertisementType}/{advertisementId}/payment",
    resubmitEndpoint: "/api/v2/ads/{advertisementType}/{advertisementId}/payment/resubmit",
    statusEndpoint: "/api/v2/ads/{advertisementType}/{advertisementId}/payment",
    method: "POST",
    fields: [
      { name: "PaymentMethodId", type: "radio", required: true, visible: true, optionsSource: "paymentMethods", order: 1 },
      { name: "TransactionReference", type: "text", required: false, visible: true, order: 2 },
      { name: "Screenshot", type: "image", required: true, visible: true, order: 3 },
      { name: "Notes", type: "textarea", required: false, visible: true, order: 4 },
      { name: "ExpectedAmount", type: "number", required: false, visible: false, order: 5 },
      { name: "ExpectedCurrency", type: "text", required: false, visible: false, order: 6 },
    ],
  },
};

const config = { isEnabled: true, price: 50, currency: "EGP", paymentMethods: [{ id: 2, name: "InstaPay" }] };

describe("paymentGate", () => {
  it("never skips payment on a config failure", () => {
    assert.equal(paymentGate({ formData: lookup, config: null, configStatus: "error" }), "error");
    assert.equal(paymentGate({ formData: lookup, config: null, configStatus: "pending" }), "loading");
  });

  it("follows the live isEnabled switch", () => {
    assert.equal(paymentGate({ formData: lookup, config, configStatus: "success" }), "required");
    assert.equal(paymentGate({ formData: lookup, config: { ...config, isEnabled: false }, configStatus: "success" }), "none");
    assert.equal(paymentGate({ formData: {}, config, configStatus: "success" }), "none");
  });
});

describe("user payment fields", () => {
  it("hides an optional TransactionReference and the hidden fields", () => {
    const names = userPaymentFields(lookup.payment.fields).map((field) => field.name);

    assert.deepEqual(names, ["PaymentMethodId", "Screenshot", "Notes"]);
  });

  it("shows TransactionReference once the Lookup makes it required", () => {
    const fields = lookup.payment.fields.map((field) =>
      field.name === "TransactionReference" ? { ...field, required: true } : field
    );

    assert.ok(userPaymentFields(fields).some((field) => field.name === "TransactionReference"));

    const body = buildPaymentFormData(fields, { PaymentMethodId: 2, TransactionReference: " TX-1 " }, config);

    assert.equal(body.get("TransactionReference"), "TX-1");
  });
});

describe("buildPaymentFormData", () => {
  it("sends the screenshot as a file and the price that was shown", () => {
    const screenshot = new File(["img"], "receipt.jpg", { type: "image/jpeg" });

    const body = buildPaymentFormData(
      lookup.payment.fields,
      { PaymentMethodId: 2, Screenshot: screenshot, Notes: "", TransactionReference: "ignored" },
      config
    );

    assert.equal(body.get("PaymentMethodId"), "2");
    assert.ok(body.get("Screenshot") instanceof Blob);
    assert.equal(body.get("ExpectedAmount"), "50");
    assert.equal(body.get("ExpectedCurrency"), "EGP");
    assert.equal(body.has("Notes"), false);
    assert.equal(body.has("TransactionReference"), false);
  });
});

describe("endpoints", () => {
  it("fills the Lookup template with the new advertisement's id", () => {
    assert.deepEqual(paymentTarget(lookup, "b997c291-59fd-4af9-b2e1-a516d8701582"), {
      url: "/api/v2/ads/90/b997c291-59fd-4af9-b2e1-a516d8701582/payment",
      method: "POST",
    });

    assert.equal(
      paymentTarget(lookup, "abc", { resubmit: true }).url,
      "/api/v2/ads/90/abc/payment/resubmit"
    );
  });

  it("refuses a template it cannot fill", () => {
    assert.equal(fillPaymentEndpoint("/api/v2/ads/{advertisementType}/{advertisementId}/payment", { advertisementType: 90 }), null);
    assert.equal(paymentTarget(lookup, null), null);
  });

  it("reads the created id from data.id", () => {
    assert.equal(createdAdvertisementId({ data: { id: "x-1" } }), "x-1");
    assert.equal(createdAdvertisementId({ data: {} }), null);
  });
});
