export const HOME_SECTIONS = [
  {
    key: "cars-private",
    title: "سيارات ملاكي",
    subtitle: "أحدث السيارات الملاكي المعروضة",
    category: { name: "Cars", nameAr: "سيارات" },
    subCategory: { name: "Private", nameAr: "ملاكي" },
  },
  {
    key: "factories",
    title: "المصانع",
    subtitle: "مصانع ومنشآت صناعية",
    category: { name: "Business", nameAr: "رجال أعمال" },
    subCategory: { name: "Factories", nameAr: "المصانع" },
  },
  {
    key: "companies",
    title: "الشركات",
    subtitle: "شركات وخدمات الأعمال",
    category: { name: "Business", nameAr: "رجال أعمال" },
    subCategory: { name: "Companies", nameAr: "الشركات" },
  },
  {
    key: "apartments",
    title: "شقق",
    subtitle: "شقق للبيع والإيجار",
    category: { name: "Real Estate", nameAr: "عقارات" },
    subCategory: { name: "Apartments", nameAr: "شقق" },
  },
  {
    key: "furniture",
    title: "الأثاث",
    subtitle: "افرش بيتك بأفضل الأسعار",
    category: { name: "Home Furnishing", nameAr: "افرش بيتك" },
    subCategory: { name: "Furniture", nameAr: "أثاث" },
  },
  {
    key: "electronics",
    title: "الإلكترونيات",
    subtitle: "التسوق أونلاين",
    category: { name: "Online Shopping", nameAr: "التسوق أونلاين" },
    subCategory: { name: "Electronics", nameAr: "إلكترونيات" },
  },
  {
    key: "antiques",
    title: "التحف",
    subtitle: "التحف والأنتيكات",
    category: { name: "Antiques", nameAr: "التحف والأنتيكات" },
    subCategory: { name: "Antiques Decor", nameAr: "تحف" },
  },
];

/** Compare a tree node against a `{ name, nameAr }` key, English first. */
function matches(node, key) {
  if (!node || !key) return false;

  const same = (a, b) =>
    typeof a === "string" &&
    typeof b === "string" &&
    a.trim().toLowerCase() === b.trim().toLowerCase();

  return same(node.name, key.name) || same(node.nameAr, key.nameAr);
}

export function resolveSection(categories, section) {
  const category = (categories ?? []).find((node) =>
    matches(node, section.category)
  );

  if (!category) return null;

  const subCategory = (category.subCategories ?? []).find((node) =>
    matches(node, section.subCategory)
  );

  if (!subCategory) return null;

  return { categoryId: category.id, subCategoryId: subCategory.id };
}
