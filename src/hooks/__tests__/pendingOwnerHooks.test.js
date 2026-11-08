import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

/* The Phase 2 hooks called as plain functions. React's context returns the
   signed-in account; React Query is a recorder that hands back canned answers
   per query key and captures mutation options. */

const OWNER_ID = "21467f80-0000-4000-8000-000000000001";

const AD_ID = "563c143e-714a-4580-a4bd-601aeadda510";

let session = { user: { id: OWNER_ID } };

let statusAnswer = {};

const queries = [];

let mutationOptions = null;

const invalidated = [];

const toasts = [];

mock.module("react", {
  namedExports: {
    useContext: () => session,
    useMemo: (factory) => factory(),
    useCallback: (callback) => callback,
    useRef: (value) => ({ current: value }),
    useState: (value) => [typeof value === "function" ? value() : value, () => {}],
    createContext: () => ({}),
  },
});

mock.module("../../context/AuthContext.jsx", { namedExports: { AuthContext: {} } });

mock.module("@tanstack/react-query", {
  namedExports: {
    useQuery: (options) => {
      queries.push(options);

      if (options.queryKey[0] === "ad-payment") {
        return options.enabled ? statusAnswer : { isSuccess: false, isError: false, data: undefined };
      }

      return { data: undefined, isPending: false, isFetching: false, isError: false };
    },
    useMutation: (options) => {
      mutationOptions = options;

      return { mutate() {}, mutateAsync: async () => {} };
    },
    useQueryClient: () => ({
      invalidateQueries: (filter) => invalidated.push(JSON.stringify(filter.queryKey)),
    }),
  },
});

mock.module("react-hot-toast", {
  defaultExport: Object.assign((message) => toasts.push(["info", message]), {
    success: (message) => toasts.push(["success", message]),
    error: (message) => toasts.push(["error", message]),
  }),
});

const offline = async () => {
  throw new Error("network disabled in tests");
};

mock.module("../../api/axiosInstance.js", {
  defaultExport: { get: offline, post: offline, put: offline, patch: offline, delete: offline },
  namedExports: { API_BASE_URL: "https://api.test/" },
});

mock.module("../useListingModuleType.js", { defaultExport: () => ({ type: 50, isResolved: true }) });

const { default: useListingOwnerStatus } = await import("../useListingOwnerStatus.js");
const { default: useAdvertisementActions } = await import("../useAdvertisementActions.js");
const { default: useUpdateListing } = await import("../../pages/EditListing/useUpdateListing.js");

const PAYMENT_LOOKUP = {
  advertisementType: 50,
  statusEndpoint: "/api/v2/ads/{advertisementType}/{advertisementId}/payment",
};

const statusQuery = () => queries.filter((q) => q.queryKey[0] === "ad-payment").at(-1);

beforeEach(() => {
  session = { user: { id: OWNER_ID } };
  statusAnswer = {};
  queries.length = 0;
  invalidated.length = 0;
  toasts.length = 0;
});

describe("useListingOwnerStatus", () => {
  it("owner's pending listing: the server's status, no published-only interactions, no favourite", () => {
    statusAnswer = {
      isSuccess: true,
      isError: false,
      data: { advertisementModerationStatus: "Pending", advertisementModerationStatusName: "قيد المراجعة" },
    };

    const result = useListingOwnerStatus({ record: { id: AD_ID, ownerId: OWNER_ID }, paymentLookup: PAYMENT_LOOKUP });

    assert.equal(result.isOwnerByRecord, true);
    assert.deepEqual(result.moderation, { status: "Pending", name: "قيد المراجعة", isPending: true });
    assert.equal(result.askInteractions, false);
    assert.equal(result.offerFavorite, false);

    assert.equal(statusQuery().enabled, true);
    assert.deepEqual(statusQuery().queryKey, ["ad-payment", "status", "50", AD_ID], "same cache entry as the payment page");
  });

  it("someone else's listing: the owner-only status is never asked", () => {
    session = { user: { id: "another-user" } };

    const result = useListingOwnerStatus({ record: { id: AD_ID, ownerId: OWNER_ID }, paymentLookup: PAYMENT_LOOKUP });

    assert.equal(result.isOwnerByRecord, false);
    assert.equal(statusQuery().enabled, false);
    assert.equal(result.askInteractions, true);
    assert.equal(result.offerFavorite, true);
  });

  it("signed out: never the owner, nothing asked", () => {
    session = { user: null };

    const result = useListingOwnerStatus({ record: { id: AD_ID, ownerId: OWNER_ID }, paymentLookup: PAYMENT_LOOKUP });

    assert.equal(result.isOwnerByRecord, false);
    assert.equal(statusQuery().enabled, false);
  });

  it("owner, status loading: interactions wait", () => {
    statusAnswer = { isSuccess: false, isError: false, data: undefined };

    const result = useListingOwnerStatus({ record: { id: AD_ID, ownerId: OWNER_ID }, paymentLookup: PAYMENT_LOOKUP });

    assert.equal(result.statusSettled, false);
    assert.equal(result.askInteractions, false);
  });

  it("owner, status read failed: the page behaves as before (nothing invented)", () => {
    statusAnswer = { isSuccess: false, isError: true, data: undefined };

    const result = useListingOwnerStatus({ record: { id: AD_ID, ownerId: OWNER_ID }, paymentLookup: PAYMENT_LOOKUP });

    assert.equal(result.moderation.isPending, false);
    assert.equal(result.askInteractions, true);
  });

  it("a module with no status endpoint: nothing asked, page as before", () => {
    const result = useListingOwnerStatus({ record: { id: AD_ID, ownerId: OWNER_ID }, paymentLookup: null });

    assert.equal(statusQuery().enabled, false);
    assert.equal(result.statusSettled, true);
    assert.equal(result.askInteractions, true);
  });
});

describe("useAdvertisementActions — request count for the owner's pending listing", () => {
  it("is not requested at all when the page says interactions do not apply", () => {
    useAdvertisementActions({ id: AD_ID, type: 50, enabled: false });

    const actions = queries.filter((q) => q.queryKey[0] === "advertisement-actions").at(-1);

    assert.equal(actions.enabled, false);
  });

  it("is requested once (no retry on its 404) when it does apply", () => {
    useAdvertisementActions({ id: AD_ID, type: 50 });

    const actions = queries.filter((q) => q.queryKey[0] === "advertisement-actions").at(-1);

    assert.equal(actions.enabled, true);
    assert.equal(actions.retry(0, { response: { status: 404 } }), false);
  });
});

describe("useUpdateListing — status after editing", () => {
  it("re-reads the server's moderation status; never sets one", () => {
    useUpdateListing();

    mutationOptions.onSuccess(
      { response: { success: true, message: "تم حفظ تعديلات المنشور، وهيتراجع تاني قبل ما يظهر." }, failures: [] },
      { endpoint: `/api/furniture/${AD_ID}` }
    );

    assert.ok(invalidated.includes(JSON.stringify(["ad-payment", "status"])));
    assert.ok(invalidated.includes(JSON.stringify(["dynamic-details", `/api/furniture/${AD_ID}`])));
    assert.ok(invalidated.includes(JSON.stringify(["my-listings"])));
    assert.deepEqual(toasts, [["success", "تم حفظ تعديلات المنشور، وهيتراجع تاني قبل ما يظهر."]]);
  });

  it("a photo step that failed after the save is reported as an error, not folded into success", () => {
    useUpdateListing();

    mutationOptions.onSuccess(
      { response: { success: true, message: "تم الحفظ" }, failures: [{ step: "add", count: 1 }] },
      { endpoint: `/api/ads/${AD_ID}` }
    );

    assert.equal(toasts[0][0], "success");
    assert.equal(toasts[1][0], "error");
    assert.match(toasts[1][1], /تعذّر إضافة الصور الجديدة/);
  });
});
