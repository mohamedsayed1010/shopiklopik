import Seo from "../Seo";

import useCategoriesTree from "./useCategoriesTree";
import CategoryCard from "./CategoryCard";
import PageHeader from "../ui/PageHeader";
import Steps from "../ui/Steps";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import { CategoryGridSkeleton } from "../ui/Skeleton";

const STEPS = ["القسم", "القسم الفرعي", "بيانات الإعلان"];

export default function CreateAd() {
  const { categories, isLoading, isError } = useCategoriesTree();

  return (
    <>
      <Seo title="إضافة إعلان: اختر القسم" />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          title="اختر القسم المناسب"
          subtitle="حدّد القسم الذي ينتمي إليه إعلانك لعرض الحقول الصحيحة"
          className="mb-6"
        />

        <Steps steps={STEPS} current={0} className="mb-8" />

        {isLoading ? (
          <CategoryGridSkeleton />
        ) : isError ? (
          <ErrorState description="تعذّر تحميل الأقسام. حاول تحديث الصفحة." />
        ) : categories.length === 0 ? (
          <EmptyState
            title="لا توجد أقسام متاحة"
            description="لا يمكن نشر إعلان حالياً. حاول مرة أخرى لاحقاً."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
