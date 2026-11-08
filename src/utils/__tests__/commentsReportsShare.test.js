import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  COMMENT_MAX_LENGTH,
  REPORT_DETAILS_MAX_LENGTH,
  lengthState,
  selectedReportReason,
  validateComment,
  validateReportDetails,
} from "../interactionLimits.js";
import { canOfferReport, interactionPolicy } from "../listingModeration.js";
import { listingShareText, listingShareUrl, shareFeedback, shareListing } from "../shareListing.js";
import { writeToClipboard } from "../clipboard.js";

/* The six reasons production publishes in /api/advertisements/metadata. */
const REASONS = [
  { id: 1, name: "إعلان مخالف" },
  { id: 2, name: "احتيال" },
  { id: 3, name: "بيانات غير صحيحة" },
  { id: 4, name: "محتوى غير لائق" },
  { id: 5, name: "إعلان مكرر" },
  { id: 6, name: "أخرى" },
];

describe("comment length", () => {
  it("one limit for every comment box", () => {
    assert.equal(COMMENT_MAX_LENGTH, 1000);
  });

  it("empty and whitespace-only comments are refused", () => {
    for (const text of ["", "   ", "\n\t  \n", undefined, null]) {
      assert.equal(validateComment(text).error, "اكتب تعليقًا قبل الإرسال.");
    }
  });

  it("a normal comment passes, trimmed", () => {
    assert.deepEqual(validateComment("  تعليق تجريبي  "), { value: "تعليق تجريبي", error: null });
  });

  it("exactly at the limit passes; one over is refused", () => {
    assert.equal(validateComment("ا".repeat(COMMENT_MAX_LENGTH)).error, null);
    assert.match(validateComment("ا".repeat(COMMENT_MAX_LENGTH + 1)).error, /أطول من الحد المسموح \(1000/);
  });

  it("surrounding spaces do not count against the limit", () => {
    assert.equal(validateComment(`  ${"a".repeat(COMMENT_MAX_LENGTH)}  `).error, null);
  });
});

describe("character counter", () => {
  it("updates with every character", () => {
    assert.equal(lengthState("", 1000).label, "0/1000");
    assert.equal(lengthState("abc", 1000).label, "3/1000");
    assert.equal(lengthState("أهلاً", 1000).length, 5);
  });

  it("warns in the last tenth and flags going over", () => {
    assert.equal(lengthState("a".repeat(900), 1000).isNear, false);
    assert.equal(lengthState("a".repeat(901), 1000).isNear, true);
    assert.equal(lengthState("a".repeat(1000), 1000).isOver, false);
    assert.equal(lengthState("a".repeat(1001), 1000).isOver, true);
    assert.equal(lengthState("a".repeat(1001), 1000).remaining, -1);
  });
});

describe("report details", () => {
  it("one limit for every report form", () => {
    assert.equal(REPORT_DETAILS_MAX_LENGTH, 1000);
  });

  it("optional: empty and whitespace-only are sent as an empty string", () => {
    assert.deepEqual(validateReportDetails(""), { value: "", error: null });
    assert.deepEqual(validateReportDetails("   \n "), { value: "", error: null });
  });

  it("over the limit is refused with a clear message", () => {
    assert.match(validateReportDetails("x".repeat(REPORT_DETAILS_MAX_LENGTH + 1)).error, /التفاصيل أطول من الحد المسموح/);
    assert.equal(validateReportDetails("x".repeat(REPORT_DETAILS_MAX_LENGTH)).error, null);
  });
});

describe("report reason", () => {
  it("nothing is selected until the reader chooses — never the first reason", () => {
    assert.equal(selectedReportReason(null, REASONS), null);
    assert.equal(selectedReportReason(undefined, REASONS), null);
  });

  it("the reader's choice is used as-is (the payload's numeric id)", () => {
    assert.equal(selectedReportReason(3, REASONS), 3);
    assert.equal(selectedReportReason("5", REASONS), 5);
  });

  it("a choice that is not a published reason counts as no choice", () => {
    assert.equal(selectedReportReason(99, REASONS), null);
    assert.equal(selectedReportReason(1, []), null, "reasons not loaded yet");
  });
});

describe("report and ownership", () => {
  it("the owner is never offered a report on their own listing", () => {
    assert.equal(canOfferReport({ isOwner: true, hasReported: false, actions: { canReport: true } }), false);
  });

  it("other signed-in readers can report a public listing the server allows", () => {
    assert.equal(canOfferReport({ isOwner: false, hasReported: false, actions: { canReport: true, isOwner: false } }), true);
  });

  it("the server's refusal still wins for everyone", () => {
    assert.equal(canOfferReport({ isOwner: false, hasReported: false, actions: { canReport: false } }), false);
  });
});

describe("controls on the owner's pending listing", () => {
  it("favorite and share are withheld; published listings keep both", () => {
    const pending = interactionPolicy({ isOwnerByRecord: true, statusSettled: true, isPending: true });

    assert.equal(pending.offerFavorite, false);
    assert.equal(pending.offerShare, false);

    const published = interactionPolicy({ isOwnerByRecord: false, statusSettled: false, isPending: false });

    assert.equal(published.offerFavorite, true);
    assert.equal(published.offerShare, true);
  });
});

describe("sharing a listing", () => {
  const location = {
    origin: "https://shopiklopik.com",
    pathname: "/dynamic/10/40/193b305d-88bb-4b0c-a7a2-57413daf1421",
    search: "?focus=comments",
    hash: "#gallery",
  };

  const URL = "https://shopiklopik.com/dynamic/10/40/193b305d-88bb-4b0c-a7a2-57413daf1421";

  it("shares the listing's own address — no query, no hash, no extra ids", () => {
    assert.equal(listingShareUrl(location), URL);
    assert.equal(listingShareUrl({}), "");
  });

  it("phone / native sheet: title, text and the listing address", async () => {
    const calls = [];

    const nav = { share: async (payload) => calls.push(payload) };

    assert.equal(await shareListing({ url: URL, title: "كنبه مريحه" }, { nav, copy: async () => true }), "shared");
    assert.deepEqual(calls, [{ title: "كنبه مريحه", text: listingShareText("كنبه مريحه"), url: URL }]);
  });

  it("dismissing the sheet is not an error and copies nothing", async () => {
    let copied = false;

    const nav = { share: async () => { throw Object.assign(new Error("cancel"), { name: "AbortError" }); } };

    const outcome = await shareListing({ url: URL, title: "x" }, { nav, copy: async () => { copied = true; return true; } });

    assert.equal(outcome, "cancelled");
    assert.equal(copied, false);
    assert.equal(shareFeedback(outcome), null);
  });

  it("no native sheet (most desktops): the address is copied and the reader told", async () => {
    let copiedText = null;

    const outcome = await shareListing({ url: URL, title: "x" }, { nav: {}, copy: async (text) => { copiedText = text; return true; } });

    assert.equal(outcome, "copied");
    assert.equal(copiedText, URL);
    assert.deepEqual(shareFeedback(outcome), { kind: "success", text: "تم نسخ رابط الإعلان" });
  });

  it("a sheet that fails for another reason falls back to copying", async () => {
    const nav = { share: async () => { throw Object.assign(new Error("denied"), { name: "NotAllowedError" }); } };

    assert.equal(await shareListing({ url: URL, title: "x" }, { nav, copy: async () => true }), "copied");
  });

  it("canShare() refusing the payload skips the sheet", async () => {
    let shared = false;

    const nav = { canShare: () => false, share: async () => { shared = true; } };

    assert.equal(await shareListing({ url: URL }, { nav, copy: async () => true }), "copied");
    assert.equal(shared, false);
  });

  it("a failed copy is reported as a failure, never a success", async () => {
    const outcome = await shareListing({ url: URL, title: "x" }, { nav: {}, copy: async () => false });

    assert.equal(outcome, "failed");
    assert.equal(shareFeedback(outcome).kind, "error");
  });

  it("no address, nothing shared", async () => {
    assert.equal(await shareListing({ url: "" }, { nav: { share: async () => {} }, copy: async () => true }), "failed");
  });
});

describe("clipboard", () => {
  it("uses the Clipboard API when it works", async () => {
    let written = null;

    const nav = { clipboard: { writeText: async (text) => { written = text; } } };

    assert.equal(await writeToClipboard("abc", { nav, doc: null }), true);
    assert.equal(written, "abc");
  });

  it("falls back to the legacy copy when permission is refused", async () => {
    const appended = [];

    const doc = {
      body: { appendChild: (el) => appended.push(el), removeChild: () => {} },
      createElement: () => ({ style: {}, setAttribute() {}, select() {} }),
      execCommand: (command) => command === "copy",
    };

    const nav = { clipboard: { writeText: async () => { throw new Error("NotAllowedError"); } } };

    assert.equal(await writeToClipboard("abc", { nav, doc }), true);
    assert.equal(appended.length, 1);
  });

  it("reports failure when neither path works", async () => {
    const doc = {
      body: { appendChild() {}, removeChild() {} },
      createElement: () => ({ style: {}, setAttribute() {}, select() {} }),
      execCommand: () => false,
    };

    assert.equal(await writeToClipboard("abc", { nav: {}, doc }), false);
    assert.equal(await writeToClipboard("abc", { nav: {}, doc: null }), false);
  });
});
