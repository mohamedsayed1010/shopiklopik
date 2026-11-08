import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

/* `useListingRoutes` called as a plain function: React's memo is a pass-through
   and React Query is a table of canned answers, so a test can see exactly
   which read-config requests the hook would enable. */

const TREE = [
  { id: 1, name: "Cars", nameAr: "سيارات", subCategories: [{ id: 1, name: "Private", nameAr: "ملاكي" }, { id: 2, name: "Taxi", nameAr: "أجرة" }] },
  { id: 3, name: "Lost", nameAr: "المفقودات", subCategories: [{ id: 7, name: "Lost", nameAr: "ضايع مني" }, { id: 8, name: "Found", nameAr: "لقيت" }] },
  { id: 10, name: "Home", nameAr: "افرش بيتك", subCategories: [{ id: 40, name: "Furniture", nameAr: "أثاث" }] },
];

/* The production metadata entries that matter here. */
const METADATA = {
  data: {
    modules: [
      { id: 1, name: "Advertisement", route: "ads", categoryId: 0, subCategoryId: 0 },
      { id: 50, name: "Furniture", route: "furniture", categoryId: 10, subCategoryId: 40 },
      { id: 70, name: "LostItem", route: "lost-found/lost", categoryId: 3, subCategoryId: 7 },
      { id: 71, name: "FoundItem", route: "lost-found/found", categoryId: 3, subCategoryId: 8 },
    ],
  },
};

let metadataState = { data: METADATA, isSuccess: true, isError: false };

let sweepEnabled = null;

let candidateCount = 0;

mock.module("react", {
  namedExports: { useMemo: (factory) => factory(), useCallback: (callback) => callback },
});

mock.module("@tanstack/react-query", {
  namedExports: {
    useQuery: (options) => {
      if (options.queryKey[0] === "categories-tree") return { data: { data: TREE } };

      if (options.queryKey[0] === "listing-interaction-metadata") return metadataState;

      return {};
    },
    useQueries: ({ queries }) => {
      /* The sweep is the call whose queries carry an explicit `enabled`; the
         other call is the name-guess candidates, every one of them a request. */
      if (queries.length > 0 && "enabled" in queries[0]) sweepEnabled = queries[0].enabled;
      else if (!(queries.length > 0 && "enabled" in queries[0])) candidateCount = queries.length;

      return queries.map(() => ({ isSuccess: true, isError: false, data: undefined, dataUpdatedAt: 0 }));
    },
  },
});

mock.module("../../api/categories/categories.js", { namedExports: { getCategoriesTree: async () => ({}) } });
mock.module("../../api/categories/lookups.js", { namedExports: { getReadConfig: async () => ({}) } });
mock.module("../../api/advertisements/interactions.js", {
  namedExports: { getListingInteractionMetadata: async () => ({}) },
});

const { default: useListingRoutes } = await import("../useListingRoutes.js");

beforeEach(() => {
  metadataState = { data: METADATA, isSuccess: true, isError: false };
  sweepEnabled = null;
  candidateCount = 0;
});

describe("useListingRoutes — placing a notification's module", () => {
  it("a lost item resolves by its metadata route, with no read-config sweep", () => {
    const { resolve } = useListingRoutes(["lost-found/lost"]);

    assert.deepEqual(
      { categoryId: resolve("lost-found/lost").categoryId, subCategoryId: resolve("lost-found/lost").subCategoryId },
      { categoryId: 3, subCategoryId: 7 }
    );
    assert.equal(sweepEnabled, false);
  });

  it("a found item resolves to its own pair, not the lost one", () => {
    const { resolve } = useListingRoutes(["lost-found/found"]);

    assert.equal(resolve("lost-found/found").subCategoryId, 8);
  });

  it("a module resolves by name or route alike, with no sweep", () => {
    const { resolve } = useListingRoutes(["furniture"]);

    assert.equal(resolve("Furniture").subCategoryId, 40);
    assert.equal(resolve("furniture").subCategoryId, 40);
    assert.equal(sweepEnabled, false);
  });

  it("the sweep never starts before the metadata has answered", () => {
    metadataState = { data: undefined, isSuccess: false, isError: false };

    useListingRoutes(["lost-found/lost"]);

    assert.equal(sweepEnabled, false);
  });

  it("cars (published as 0:0) still fall back to the sweep once metadata has answered", () => {
    useListingRoutes(["ads"]);

    assert.equal(sweepEnabled, true);
  });

  it("a failed metadata read still lets the fallback run", () => {
    metadataState = { data: undefined, isSuccess: false, isError: true };

    useListingRoutes(["lost-found/lost"]);

    assert.equal(sweepEnabled, true);
  });
});

describe("useListingRoutes — read-config requests per caller (fetchConfigs)", () => {
  /* The profile's per-type breakdown in production: one key per module type
     the account owns, cars ("Advertisement") among them. */
  const PROFILE_TYPES = ["Furniture", "LostItem", "Advertisement"];

  it("profile breakdown ('none'): no candidate reads and no sweep — cars stay unlinked", () => {
    const { resolve } = useListingRoutes(PROFILE_TYPES, { fetchConfigs: "none" });

    assert.equal(candidateCount, 0);
    assert.equal(sweepEnabled, false);

    // Placed types still resolve from the metadata alone.
    assert.equal(resolve("Furniture").subCategoryId, 40);
    assert.equal(resolve("LostItem").subCategoryId, 7);

    // Cars: named (metadata), not placed — the card is shown without a link.
    assert.equal(resolve("Advertisement")?.categoryId ?? null, null);
  });

  it("before this change ('all' — still the default): the same keys cost a sweep of every pair", () => {
    useListingRoutes(PROFILE_TYPES);

    assert.equal(sweepEnabled, true, "every pair in the catalogue would be read");
    assert.equal(candidateCount, 1, "plus a name-guess read for the 'Furniture' sub-category");
  });

  it("notifications ('unplaced'): nothing for keys the metadata places, the fallback only for cars", () => {
    useListingRoutes(["furniture", "lost-found/lost"], { fetchConfigs: "unplaced" });

    assert.equal(candidateCount, 0);
    assert.equal(sweepEnabled, false);

    useListingRoutes(["furniture", "ads"], { fetchConfigs: "unplaced" });

    assert.equal(candidateCount, 0, "furniture is placed by metadata — no candidate read");
    assert.equal(sweepEnabled, true, "cars cannot be placed any other way");
  });

  it("'unplaced' asks nothing before the metadata has answered", () => {
    metadataState = { data: undefined, isSuccess: false, isError: false };

    useListingRoutes(["furniture", "ads"], { fetchConfigs: "unplaced" });

    assert.equal(candidateCount, 0);
    assert.equal(sweepEnabled, false);
  });
});
