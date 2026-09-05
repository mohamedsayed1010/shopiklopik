
const isFilled = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

/** Join the parts that exist, with the separator, skipping the blanks. */
function join(parts, separator = " · ") {
  return parts.filter(isFilled).map((part) => String(part).trim()).join(separator);
}

/** Collapse whitespace and cut cleanly on a word boundary. */
export function summarize(text, max = 155) {
  const value = String(text ?? "").replace(/\s+/g, " ").trim();

  if (!value || value.length <= max) return value;

  const cut = value.slice(0, max);

  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

const DESCRIPTION_KEYS = [
  "description",
  "adDescription",
  "postDescription",
  "question",
  "details",
  "productDetails",
  "bio",
  "about",
];

/** Where a listing says it is. Narrowest first, as the header shows it. */
const PLACE_KEYS = ["center", "city", "district", "village", "governorate"];

function firstOf(source, keys) {
  for (const key of keys) {
    if (isFilled(source?.[key])) return String(source[key]).trim();
  }

  return "";
}

export function listingDescription({
  item,
  title,
  categoryName,
  subCategoryName,
} = {}) {
  const own = firstOf(item, DESCRIPTION_KEYS);

  if (own) return summarize(own);

  const place = firstOf(item, PLACE_KEYS);

  const section = join([subCategoryName, categoryName], " - ");

  /* No prose to quote, so the sentence is assembled from what is known. Each
     clause is present only if its value is. */
  const lead = join([title, section, place], " · ");

  if (!lead) return "";

  return summarize(`${lead}. اطّلع على التفاصيل وتواصل مع المُعلن مباشرة.`);
}

/** One listing's title: its own headline, placed in its section. */
export function listingTitle({ title, subCategoryName } = {}) {
  return join([title, subCategoryName], " - ") || "";
}

export function sectionDescription({
  categoryName,
  subCategoryName,
  label,
  siteName,
} = {}) {
  const section = subCategoryName || categoryName;

  if (!isFilled(section)) return "";

  const scope =
    subCategoryName && categoryName && subCategoryName !== categoryName
      ? `${subCategoryName} ضمن قسم ${categoryName}`
      : section;

  const opening = `تصفّح إعلانات ${scope}`;

  const where = isFilled(siteName) ? ` على ${siteName}` : "";

  return summarize(
    join([`${opening}${where}.`, label], " ") ||
      `${opening}${where}.`
  );
}

/** A category page's description, when only the category is known. */
export function categoryDescription({ categoryName, siteName } = {}) {
  if (!isFilled(categoryName)) return "";

  const where = isFilled(siteName) ? ` على ${siteName}` : "";

  return summarize(
    `اختر القسم الفرعي المناسب داخل قسم ${categoryName}${where} وتصفّح الإعلانات المعروضة فيه.`
  );
}
