import CategoryTile from "../../ui/CategoryTile";

export default function CategoryCard({ category }) {
  const count = category.subCategories?.length || 0;

  return (
    <CategoryTile
      to={`/category/${category.id}`}
      title={category.nameAr}
      subtitle={`${count} ${count === 1 ? "قسم فرعي" : "أقسام فرعية"}`}
    />
  );
}
