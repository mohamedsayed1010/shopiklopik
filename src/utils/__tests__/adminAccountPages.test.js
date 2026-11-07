import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { adminAccountPages, adminAccountSelection, isAdminAccountPage } from "../adminAccountPages.js";

/* The 15 keys `GET /api/v2/admin/permissions/pages` published on 2026-11-07. */
const CATALOGUE = [
  "dashboard", "ads", "users", "categories", "locations", "banners", "banner-requests",
  "payments", "reports", "feedback", "referrals", "forms", "home", "settings", "audit-logs",
].map((key) => ({ key }));

describe("admin accounts pages", () => {
  it("lets a SuperAdmin grant Categories and Ad Payments", () => {
    assert.equal(isAdminAccountPage("categories"), true);
    assert.equal(isAdminAccountPage({ pageKey: "payments" }), true);
  });

  it("still hides the remaining excluded pages", () => {
    const keys = adminAccountPages(CATALOGUE).map((page) => page.key);

    assert.equal(keys.length, 12);
    for (const hidden of ["locations", "forms", "home"]) assert.equal(keys.includes(hidden), false, hidden);
  });

  it("keeps categories and payments in the payload", () => {
    assert.deepEqual(
      adminAccountSelection({ categories: ["View"], payments: ["View", "Edit"], forms: ["View"] }),
      { categories: ["View"], payments: ["View", "Edit"] }
    );
  });
});
