import useCategoriesTree from "../../CreateAd/useCategoriesTree";
import CategoryCard from "./CategoryCard";
import { CategoryGridSkeleton } from "../../ui/Skeleton";
import EmptyState from "../../ui/EmptyState";
import ErrorState from "../../ui/ErrorState";

export default function CategoriesSection() {
  const { categories, isLoading, isError } = useCategoriesTree();

  return (
    <section id="categories" className="scroll-mt-20">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div className="relative ps-4">
          <span
            aria-hidden="true"
            className="absolute inset-y-1 w-1 rounded-full bg-gradient-to-b from-gold-300 to-brand-900 start-0"
          />

          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            تصفّح الأقسام
          </h2>

          <p className="mt-1.5 text-sm text-muted">
            اختر القسم المناسب للوصول إلى الإعلانات
          </p>
        </div>
      </div>

      {isLoading ? (
        <CategoryGridSkeleton />
      ) : isError ? (
        <ErrorState description="تعذّر تحميل الأقسام. حاول تحديث الصفحة." />
      ) : categories.length === 0 ? (
        <EmptyState
          title="لا توجد أقسام حالياً"
          description="سيتم إضافة الأقسام قريباً."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}
