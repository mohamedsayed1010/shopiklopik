import LinkTile from "../../../ui/LinkTile";

export default function SubCategoryCard({ category, categoryId, parentName }) {
  return (
    <LinkTile
      to={`/dynamic/${categoryId}/${category.id}`}
      title={category.nameAr}
      accentFrom={parentName}
    />
  );
}
