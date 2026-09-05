
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const DEFAULT_PAGE_SIZE = 20;

/** How long typing pauses before search / user id reach the query key. */
export const SEARCH_DEBOUNCE_MS = 400;

export const EMPTY_BANNER_FILTERS = {
  status: "",
  paymentStatus: "",
  location: "",
  categoryId: "",
  subCategoryId: "",
  userId: "",
  fromDate: "",
  toDate: "",
};

/** The two panels the page is split into. */
export const BANNER_TABS = [
  { key: "requests", label: "طلبات البانرات" },
  { key: "pricing", label: "الأسعار والمساحات" },
];
