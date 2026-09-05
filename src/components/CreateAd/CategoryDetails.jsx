import { useParams } from "react-router-dom";
import Seo from "../Seo";
import { Layers } from "lucide-react";

import useCategoriesTree from "./useCategoriesTree";
import SubCategoryCard from "./SubCategoryCard";
import PageHeader from "../ui/PageHeader";
import Steps from "../ui/Steps";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import { SubCategoryGridSkeleton } from "../ui/Skeleton";

const STEPS = ["القسم", "القسم الفرعي", "بيانات الإعلان"];

export default function CategoryDetails() {
  const { categoryId } = useParams();

  const { categories, isLoading, isError } = useCategoriesTree();

  const category = categories.find(
    (item) => String(item.id) === String(categoryId)
  );

  const subCategories = category?.subCategories || [];

  return (
    <>
      <Seo title="اختر القسم الفرعي" />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          eyebrow={category?.nameAr}
          title="اختر القسم الفرعي"
          subtitle="كل قسم فرعي له حقول مخصّصة تساعد المشترين في العثور على إعلانك"
          className="mb-6"
        />

        <Steps steps={STEPS} current={1} className="mb-8" />

        {isLoading ? (
          <SubCategoryGridSkeleton />
        ) : isError ? (
          <ErrorState />
        ) : subCategories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="لا يوجد أقسام فرعية"
            description="لا يمكن نشر إعلان في هذا القسم حالياً."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
