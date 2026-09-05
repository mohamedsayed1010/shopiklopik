import LinkTile from "../ui/LinkTile";

export default function SubCategoryCard({ category, categoryId, parentName }) {
  return (
    <LinkTile
      to={`/create-product/${categoryId}/${category.id}`}
      title={category.nameAr}
      accentFrom={parentName}
    />
  );
}
