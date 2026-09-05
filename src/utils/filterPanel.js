
/** Paging is the pager's job, not a filter's. */
const ALWAYS_HIDDEN = ["pageIndex", "pageSize"];

const CARS = 1;

const LOST_FOUND = 3;

const BUSINESSMEN = 4;

const ANIMALS = 6;

const ANTIQUES = 7;

const CLOTHING = 8;

const ONLINE_SHOPPING = 9;

const HOME_FURNISHING = 10;

const REAL_ESTATE = 11;

const CHARITY = 12;

/** الوظائف / طلبات عمل — a person looking for work, not an advertiser. */
const JOB_REQUESTS = "5/15";

const CAR_HIDDEN = [
  "search",
  "color",
  "year",
  "technicalCondition",
  "originCountry",
  "negotiable",
  "licenseStatus",
  "featureIds",
];

const ANTIQUES_HIDDEN = [
  "sellerName",
  "condition",
  "negotiable",
  "manufactureYear",
  "countryOfOrigin",
  "artistName",
  "framed",
  "isFullyHandmade",
  "customOrder",
  "country",
  "issueYear",
  "isOriginal",
  "isRare",
];

const CLOTHING_HIDDEN = ["storeName", "priceFrom", "priceTo"];

const ONLINE_SHOPPING_HIDDEN = [
  "storeName",
  "shippingAvailable",
  "color",
  "brand",
  "discountAvailable",
  "giftWrapping",
  "deliveryAvailable",
  "projectName",
  "preparedOnDemand",
];

const HOME_FURNISHING_HIDDEN = [
  "deliveryAvailable",
  "canBeDisassembled",
  "negotiable",
  "isFeatured",
  "isPremium",
  "isUrgent",
  "heightFrom",
  "heightTo",
];

const BUSINESSMEN_HIDDEN = [
  "factoryName",
  "farmName",
  "companyName",
  "supplierName",
  "traderName",
  "merchantName",
  "stallName",
];

const ANIMALS_HIDDEN = ["sellerName"];

const REAL_ESTATE_HIDDEN = [
  "hasStorage",
  "hasBathroom",
  "isLicensed",
  "isReconciliation",
  "negotiable",
  "hasNaturalGas",
  "hasSurveillanceCameras",
  "facadesCount",
  "hasParking",
  "hasAirConditioning",
  "roomsCount",
  "bathroomsCount",
  "hasElevator",
  "hasGarage",
  "hasBalcony",
  "ownershipType",
  "legalStatus",
  "ownershipDocument",
  "pricePerMeterFrom",
  "pricePerMeterTo",
  "areaFrom",
  "areaTo",
  "areaUnit",
  "insideBuildingCordon",
  "isBuildable",
  "isCurrentlyCultivated",
  "irrigationSource",
  "isOrganic",
  "hasWell",
  "hasIrrigationNetwork",
  "hasFence",
];

const CHARITY_HIDDEN = ["governorate", "center", "hasLocation"];

const HIDDEN_BY_CATEGORY = {
  [CARS]: CAR_HIDDEN,
  [CHARITY]: CHARITY_HIDDEN,
  [BUSINESSMEN]: BUSINESSMEN_HIDDEN,
  [ANIMALS]: ANIMALS_HIDDEN,
  [REAL_ESTATE]: REAL_ESTATE_HIDDEN,
  [ANTIQUES]: ANTIQUES_HIDDEN,
  [CLOTHING]: CLOTHING_HIDDEN,
  [ONLINE_SHOPPING]: ONLINE_SHOPPING_HIDDEN,
  [HOME_FURNISHING]: HOME_FURNISHING_HIDDEN,
};

const HIDDEN_BY_SECTION = {
  /* ملاكي — on top of the car rules. `sortBy`, `yearFrom` and `yearTo` are
     deliberately absent: this section shows them. */
  "1/1": ["bodyType"],
};

/** The ids a read config resolves to, from whichever half it publishes. */
function sectionOf(config) {
  return {
    categoryId: config?.category?.id ?? config?.list?.query?.categoryId,

    subCategoryId:
      config?.subCategory?.id ?? config?.list?.query?.subCategoryId,
  };
}

/** The filter names this config's panel must not render. */
export function hiddenFilterNames(config) {
  const { categoryId, subCategoryId } = sectionOf(config);

  const hidden = new Set([
    ...ALWAYS_HIDDEN,
    ...(HIDDEN_BY_CATEGORY[categoryId] ?? []),
    ...(HIDDEN_BY_SECTION[`${categoryId}/${subCategoryId}`] ?? []),
  ]);

  /* The picker sets this parameter, so the free-text box that also sets it is
     not offered as well — see `advertiserFilter`. */
  const advertiser = advertiserFilter(config);

  if (advertiser) hidden.add(advertiser.parameter);

  return hidden;
}

/* The panel's open/closed behaviour is no longer a per-section rule: every
   section collapses on desktop and keeps its sheet on mobile, which the
   renderer does unconditionally. */

/* بوابة الخيرات joins them: someone asking for blood or calling for help is
   not an "advertiser", and the picker's whole premise — browse the section by
   who is selling — does not apply to a charity request. */
const NO_ADVERTISER_CATEGORIES = new Set([
  CARS,
  REAL_ESTATE,
  LOST_FOUND,
  CHARITY,
]);

const NO_ADVERTISER_SECTIONS = new Set([JOB_REQUESTS]);

/** The parameter the picker drives, and what the control is called. */
const ADVERTISER = { parameter: "search", label: "المعلن" };

export function advertiserFilter(config) {
  const { categoryId, subCategoryId } = sectionOf(config);

  if (NO_ADVERTISER_CATEGORIES.has(categoryId)) return null;

  if (NO_ADVERTISER_SECTIONS.has(`${categoryId}/${subCategoryId}`)) return null;

  const publishes = (config?.list?.queryParameters ?? []).some(
    (parameter) => parameter.name === ADVERTISER.parameter
  );

  return publishes ? ADVERTISER : null;
}
