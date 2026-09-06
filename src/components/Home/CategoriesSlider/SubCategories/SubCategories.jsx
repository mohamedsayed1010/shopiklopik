import { useParams } from "react-router-dom";
import Seo from "../../../Seo";
import JsonLd from "../../../JsonLd";
import { categoryDescription } from "../../../../seo/descriptions";
import { categoryGraph } from "../../../../seo/structuredData";
import { Layers } from "lucide-react";

import useCategoriesTree from "../../../CreateAd/useCategoriesTree";
import SubCategoryCard from "./SubCategoryCard";
import PageHeader from "../../../ui/PageHeader";
import EmptyState from "../../../ui/EmptyState";
import ErrorState from "../../../ui/ErrorState";
import { SubCategoryGridSkeleton } from "../../../ui/Skeleton";
import NotFound from "../../../../pages/NotFound";

export default function SubCategories() {
  const { categoryId } = useParams();

  const { categories, isLoading, isError } = useCategoriesTree();

  const category = categories.find(
    (item) => String(item.id) === String(categoryId)
  );

  const subCategories = category?.subCategories || [];


  const isMissingCategory =
    !isLoading && !isError && categories.length > 0 && !category;

  /* Rendered instead of this page, not inside it, so the reader gets the
     ordinary not-found experience and its `noindex, follow` — rather than this
     page's own `index, follow` and a heading for a section that is not there. */
  if (isMissingCategory) return <NotFound />;

  return (
    <>
      {/* The category-s own Arabic name, straight from the tree the backend
          publishes — nothing about which category this is lives here. */}
      <Seo
        title={category?.nameAr ?? category?.name ?? "الأقسام"}
        description={categoryDescription({
          categoryName: category?.nameAr ?? category?.name,
        })}
      />

      {/* The trail back to the home page, and the sections this category
          holds — every one of them an address a reader can open without an
          account. Built from the same tree the grid below renders, so the two
          can never disagree. */}
      <JsonLd data={categoryGraph({ category })} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          eyebrow={category?.nameAr}
          title="اختر القسم الفرعي"
          subtitle="حدّد القسم للوصول إلى الإعلانات المتاحة"
          className="mb-8"
        />

        {isLoading ? (
          <SubCategoryGridSkeleton />
        ) : isError ? (
          <ErrorState />
        ) : subCategories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="لا توجد أقسام فرعية"
            description="لم يتم إضافة أقسام فرعية لهذا القسم بعد."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {subCategories.map((sub) => (
              <SubCategoryCard
                key={sub.id}
                category={sub}
                categoryId={category.id}
                parentName={category.nameAr}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
