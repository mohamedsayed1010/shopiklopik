import { useParams } from "react-router-dom";
import Seo from "../../../Seo";
import JsonLd from "../../../JsonLd";
import { categoryDescription } from "../../../../seo/descriptions";
import { categoryGraph } from "../../../../seo/structuredData";
import { categoryLead } from "../../../../seo/pageCopy";
import { Layers } from "lucide-react";

import useCategoriesTree from "../../../CreateAd/useCategoriesTree";
import SubCategoryCard from "./SubCategoryCard";
import PageHeader from "../../../ui/PageHeader";
import Breadcrumbs from "../../../ui/Breadcrumbs";
import EmptyState from "../../../ui/EmptyState";
import ErrorState from "../../../ui/ErrorState";
import { SubCategoryGridSkeleton } from "../../../ui/Skeleton";
import NotFound from "../../../../pages/NotFound";

export default function SubCategories() {
  const { categoryId } = useParams();

  const { categories, isLoading, isError, isSuccess } = useCategoriesTree();

  const category = categories.find(
    (item) => String(item.id) === String(categoryId)
  );

  const subCategories = category?.subCategories || [];

  const categoryName = category?.nameAr ?? category?.name;

  /* A category is addressed by its numeric id, so an id that is not a positive
     integer names nothing the tree could ever hold. Answering that from the
     address alone is what keeps `/category/abc` off this page on the first
     paint, instead of behind a request whose answer is already known. */
  const isMalformedId = !/^\d+$/.test(String(categoryId ?? ""));

  /* A well-formed id the loaded tree does not carry. Only the tree can answer
     this one, so it still waits for the request — but a tree that came back is
     a complete answer, empty or not, and nothing is asked of its length. */
  const isUnknownCategory = isSuccess && !category;

  const isMissingCategory = isMalformedId || isUnknownCategory;

  /* Rendered instead of this page, not inside it, so the reader gets the
     ordinary not-found experience and its `noindex, follow` — rather than this
     page's own `index, follow` and a heading for a section that is not there. */
  if (isMissingCategory) return <NotFound />;

  return (
    <>
      {/* The category-s own Arabic name, straight from the tree the backend
          publishes — nothing about which category this is lives here. */}
      <Seo
        title={categoryName ?? "الأقسام"}
        description={categoryDescription({ categoryName })}
      />

      {/* The trail back to the home page, and the sections this category
          holds — every one of them an address a reader can open without an
          account. Built from the same tree the grid below renders, so the two
          can never disagree. */}
      <JsonLd data={categoryGraph({ category })} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* The trail the BreadcrumbList above describes. */}
        <Breadcrumbs
          trail={[{ label: "الرئيسية", to: "/" }, { label: categoryName }]}
          className="mb-3"
        />

        {/* The category is the page's one heading — the same h1 the
            prerendered document carries — and the lead says what it holds. */}
        <PageHeader
          title={categoryName}
          subtitle={categoryLead({
            categoryName,
            subCategoryCount: subCategories.length,
          })}
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
