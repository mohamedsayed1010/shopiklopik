import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  NOTIFICATION_TYPE,
  SUBMITTED_TYPES,
  isAwaitingReview,
  isEditedAwaitingReview,
  isNoLongerEligible,
  listingTitleOf,
  messageWithoutListingTitle,
} from "../../../api/notifications/notificationTypes.js";
import { readNotification } from "../notificationTarget.js";
import { registerAppRoutes } from "../../../Routes/routeRegistry.js";
import {
  countAfterReadingAll,
  countAfterReadingOne,
  createSeenIds,
  drawerUnreadCount,
  markAllReadInList,
  markOneReadInList,
  wasUnreadInLists,
} from "../notificationState.js";
import { canonicalDetailsPath } from "../../../utils/detailsRoute.js";

/* The payloads below are the production ones (2026-11-08, test account), ids
   replaced. `listingTitle`, `categoryId`, `subCategoryId` are absent because
   production does not send them. */
const CAR = {
  id: "n-car",
  type: 4,
  action: 1,
  icon: "📢",
  entityName: "الإعلان",
  referenceId: "df7736e5-dc9f-4ea8-97b9-f27ebfa78bac",
  referenceType: "Advertisement",
  deepLink: "/ads/df7736e5-dc9f-4ea8-97b9-f27ebfa78bac",
  title: "تم إرسال الإعلان",
  message: "📢 تم إرسال الإعلان بنجاح، وهو الآن قيد المراجعة من الإدارة قبل النشر. (E2E_TEST_2026_11_08 - ملاكي - اختبار UAT لا تتواصل)",
  isRead: false,
};

const FURNITURE = {
  id: "n-furniture",
  type: 20,
  action: 1,
  icon: "🛋️",
  entityName: "إعلان الأثاث",
  referenceId: "563c143e-714a-4580-a4bd-601aeadda510",
  referenceType: "Furniture",
  deepLink: "/furniture/563c143e-714a-4580-a4bd-601aeadda510",
  title: "تم إرسال إعلان الأثاث",
  message: "🛋️ تم إرسال إعلان الأثاث بنجاح، وهو الآن قيد المراجعة من الإدارة قبل النشر. (E2E_TEST_2026_11_08 - أثاث - اختبار UAT لا تتواصل)",
  isRead: false,
};

const LOST_FOUND = {
  id: "n-lost",
  type: 8,
  action: 1,
  icon: "🔍",
  entityName: "بلاغ المفقودات",
  referenceId: "bc175b96-99dc-4255-86d9-7d3f71cec9fe",
  referenceType: "LostFoundPost",
  deepLink: "/lost-found/lost/bc175b96-99dc-4255-86d9-7d3f71cec9fe",
  title: "تم إرسال بلاغ المفقودات",
  message: "🔍 تم إرسال بلاغ المفقودات بنجاح، وهو الآن قيد المراجعة من الإدارة قبل النشر. (E2E اختبار ضايع مني)",
  isRead: false,
};

const EDITED = { ...LOST_FOUND, id: "n-edit", type: 21, action: 2, title: "تم تحديث بلاغ المفقودات" };

const SIGN_IN = {
  id: "n-login",
  type: 25,
  action: 1,
  referenceType: "Account",
  deepLink: null,
  referenceId: null,
  title: "تسجيل دخول جديد",
  message: "🛡️ تم تسجيل دخول جديد إلى حسابك.",
  isRead: false,
};

const PAYMENT = {
  id: "n-pay",
  type: 18,
  action: 2,
  referenceId: "d0dc7e2a-7f34-4088-a555-6155016d1435",
  referenceType: "Payment",
  deepLink: "/payments/d0dc7e2a-7f34-4088-a555-6155016d1435",
  title: "تأكيد الدفع",
  message: "✅ تم تأكيد دفع رسوم إعلان «معمل امانه». الإعلان دلوقتي في انتظار مراجعة",
  isRead: true,
};

describe("notification types — one 'submitted' category for every module", () => {
  it("car (4), lost & found (8) and module (20) submissions are all awaiting review", () => {
    for (const notification of [CAR, LOST_FOUND, FURNITURE]) {
      assert.equal(isAwaitingReview(notification), true, notification.referenceType);
    }

    assert.deepEqual([...SUBMITTED_TYPES].sort((a, b) => a - b), [4, 8, 20]);
  });

  it("an edit is 'edited, back in review', not a new submission", () => {
    assert.equal(isEditedAwaitingReview(EDITED), true);
    assert.equal(isAwaitingReview(EDITED), false);
  });

  it("rejected / deleted keep their meaning", () => {
    assert.equal(isNoLongerEligible({ ...FURNITURE, type: NOTIFICATION_TYPE.rejected }), true);
    assert.equal(isNoLongerEligible({ ...FURNITURE, type: 6, action: 5 }), true);
    assert.equal(isNoLongerEligible({ ...FURNITURE, type: NOTIFICATION_TYPE.deleted }), true);
    assert.equal(isNoLongerEligible(FURNITURE), false);
  });

  it("notifications about no listing are never 'awaiting review'", () => {
    assert.equal(isAwaitingReview(SIGN_IN), false);
    assert.equal(isAwaitingReview({ ...SIGN_IN, type: 20 }), false);
  });
});

describe("listing title in notifications", () => {
  it("shows the car ad's real title (production sends it only inside the message)", () => {
    assert.equal(listingTitleOf(CAR), "E2E_TEST_2026_11_08 - ملاكي - اختبار UAT لا تتواصل");
  });

  it("works the same for every module", () => {
    assert.equal(listingTitleOf(FURNITURE), "E2E_TEST_2026_11_08 - أثاث - اختبار UAT لا تتواصل");
    assert.equal(listingTitleOf(LOST_FOUND), "E2E اختبار ضايع مني");
  });

  it("prefers the contract's listingTitle when the backend sends it", () => {
    assert.equal(listingTitleOf({ ...CAR, listingTitle: "  عنوان من الحقل  " }), "عنوان من الحقل");
  });

  it("invents nothing: no listing, no parentheses, empty parentheses → no title", () => {
    assert.equal(listingTitleOf(SIGN_IN), null);
    assert.equal(listingTitleOf({ ...CAR, message: "تم إرسال الإعلان بنجاح." }), null);
    assert.equal(listingTitleOf({ ...CAR, message: "رسالة ()" }), null);
    assert.equal(listingTitleOf({ ...CAR, message: undefined }), null);
    assert.equal(listingTitleOf(null), null);
  });

  it("only a trailing parenthetical counts", () => {
    assert.equal(listingTitleOf({ ...CAR, message: "(ليس عنوانًا) ثم نص بعده" }), null);
  });

  it("the title is not repeated inside the message", () => {
    const title = listingTitleOf(CAR);

    assert.equal(
      messageWithoutListingTitle(CAR, title),
      "📢 تم إرسال الإعلان بنجاح، وهو الآن قيد المراجعة من الإدارة قبل النشر."
    );

    // A message is never cut when the title came from elsewhere.
    assert.equal(messageWithoutListingTitle(CAR, "عنوان مختلف"), CAR.message);
    assert.equal(messageWithoutListingTitle(SIGN_IN, null), SIGN_IN.message);
  });
});

describe("notification destinations", () => {
  registerAppRoutes([
    { path: "/", children: [{ path: "payments/:id" }, { path: "profile" }, { path: "*" }] },
  ]);

  it("lost & found resolves by its full route, which tells lost from found", () => {
    const entry = readNotification(LOST_FOUND);

    assert.equal(entry.kind, "listing");
    assert.equal(entry.id, LOST_FOUND.referenceId);
    assert.equal(entry.primaryHint, "lost-found/lost");
    assert.ok(entry.moduleHints.includes("lost-found/lost"));
  });

  it("modules resolve by their route name", () => {
    const entry = readNotification(FURNITURE);

    assert.equal(entry.primaryHint, "furniture");
    assert.ok(entry.moduleHints.includes("Furniture"));
  });

  it("car notifications name the cars module and keep the ad id", () => {
    const entry = readNotification(CAR);

    assert.equal(entry.kind, "listing");
    assert.equal(entry.id, CAR.referenceId);
    assert.equal(entry.primaryHint, "ads");
    assert.ok(entry.endpointHints.includes("/api/ads"));
    assert.equal(entry.pair, null);
  });

  it("an app route in the deep link is used as is", () => {
    assert.deepEqual(readNotification(PAYMENT).to, `/payments/${PAYMENT.referenceId}`);
  });

  it("a notification with no link and no listing goes nowhere", () => {
    const entry = readNotification(SIGN_IN);

    assert.equal(entry.id, null);
  });

  it("a stated pair is used without any lookup (legacy/complete payloads)", () => {
    const entry = readNotification({ ...FURNITURE, categoryId: 10, subCategoryId: 40 });

    assert.deepEqual(entry.pair, { categoryId: 10, subCategoryId: 40 });
  });
});

describe("details page — corrected to the record's own pair", () => {
  const params = { categoryId: "1", subCategoryId: "1", id: CAR.referenceId };

  it("a taxi opened through the cars module's first pair moves to its own", () => {
    assert.equal(
      canonicalDetailsPath(params, { id: CAR.referenceId, categoryId: 1, subCategoryId: 2 }, { search: "?focus=comments" }),
      `/dynamic/1/2/${CAR.referenceId}?focus=comments`
    );
  });

  it("stays when already right, or when the record cannot say", () => {
    assert.equal(canonicalDetailsPath(params, { id: CAR.referenceId, categoryId: 1, subCategoryId: 1 }), null);
    assert.equal(canonicalDetailsPath(params, { id: CAR.referenceId }), null);
    assert.equal(canonicalDetailsPath(params, { id: CAR.referenceId, categoryId: 0, subCategoryId: 2 }), null);
    assert.equal(canonicalDetailsPath(params, null), null);
  });

  it("never moves on a record that is not the one asked for", () => {
    assert.equal(canonicalDetailsPath(params, { id: "someone-else", categoryId: 1, subCategoryId: 2 }), null);
  });
});

describe("unread count and read state", () => {
  const page = (items) => ({ success: true, data: { items } });

  it("the drawer shows the server's count (the bell's), not the loaded page's", () => {
    const tenLoaded = Array.from({ length: 10 }, (_, i) => ({ id: i, isRead: i >= 4 }));

    assert.equal(drawerUnreadCount(24, tenLoaded), 24);
    assert.equal(drawerUnreadCount(0, tenLoaded), 0);
    assert.equal(drawerUnreadCount(undefined, tenLoaded), 4);
    assert.equal(drawerUnreadCount(null, []), 0);
  });

  it("reading one marks only that row and lowers the badge once", () => {
    const list = page([CAR, FURNITURE]);

    const next = markOneReadInList(list, CAR.id);

    assert.equal(next.data.items[0].isRead, true);
    assert.equal(next.data.items[1].isRead, false);
    assert.equal(list.data.items[0].isRead, false, "the cached object is not mutated");

    assert.deepEqual(countAfterReadingOne({ data: 24 }, true), { data: 23 });
  });

  it("reading an already-read row changes neither the list nor the badge", () => {
    const list = page([PAYMENT]);

    assert.equal(markOneReadInList(list, PAYMENT.id), list);
    assert.equal(wasUnreadInLists([[["k"], list]], PAYMENT.id), false);
    assert.deepEqual(countAfterReadingOne({ data: 5 }, false), { data: 5 });
  });

  it("the badge never goes below zero", () => {
    assert.deepEqual(countAfterReadingOne({ data: 0 }, true), { data: 0 });
  });

  it("read-all marks every loaded row and zeroes the badge", () => {
    const next = markAllReadInList(page([CAR, FURNITURE, PAYMENT]));

    assert.ok(next.data.items.every((item) => item.isRead));
    assert.deepEqual(countAfterReadingAll({ data: 24 }), { data: 0 });
  });

  it("read-all on an all-read page returns the same object (no re-render)", () => {
    const list = page([PAYMENT]);

    assert.equal(markAllReadInList(list), list);
  });

  it("missing data is left alone", () => {
    assert.equal(markOneReadInList(undefined, "x"), undefined);
    assert.equal(markAllReadInList(null), null);
    assert.equal(countAfterReadingAll(undefined), undefined);
  });

  it("an id is acted on once, however often it is delivered", () => {
    const seen = createSeenIds(3);

    assert.equal(seen.firstTime("a"), true);
    assert.equal(seen.firstTime("a"), false);
    assert.equal(seen.firstTime(undefined), true, "unknown ids are never dropped");

    ["b", "c", "d"].forEach((id) => seen.firstTime(id));

    assert.equal(seen.size, 3, "bounded");
    assert.equal(seen.firstTime("a"), true, "the oldest is forgotten first");
  });
});
