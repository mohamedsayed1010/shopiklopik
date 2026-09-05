import { useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../../components/Seo";
import {
  BellRing,
  ChevronLeft,
  Home,
  LayoutGrid,
  ListChecks,
  Trash2,
} from "lucide-react";

import PreferencesCard from "./components/PreferencesCard";
import InterestCategoryCard from "./components/InterestCategoryCard";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Skeleton from "../../components/ui/Skeleton";
import useNotificationPreferences from "../../components/Notifications/useNotificationPreferences";
import useNotificationInterests from "../../components/Notifications/useNotificationInterests";
import { formatNumber } from "../../utils/format";

export default function NotificationSettingsPage() {
  const [isClearing, setIsClearing] = useState(false);

  const {
    preferencesQuery,
    updatePreferencesMutation,
    newListingsEnabled,
  } = useNotificationPreferences();

  const {
    optionsQuery,
    interestsQuery,
    categories,
    interests,
    toggleInterest,
    setInterestEnabledMutation,
    saveInterestsMutation,
    pendingKeys,
  } = useNotificationInterests();

  const isBulkPending = saveInterestsMutation.isPending;

  const followEverySection = () =>
    saveInterestsMutation.mutate({
      interests: categories.map((category) => ({
        categoryId: category.categoryId,
        subCategoryId: null,
      })),
      newListingsEnabled,
    });

  const clearEverySection = () =>
    saveInterestsMutation.mutate(
      { interests: [], newListingsEnabled },
      { onSuccess: () => setIsClearing(false) }
    );

  return (
    <>
      <Seo title="إعدادات الإشعارات" />

      <div className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        <nav
          aria-label="مسار التصفح"
          className="mb-5 flex items-center gap-1 text-[13px] font-medium text-muted"
        >
          <Link
            to="/"
            className="rounded-md px-1 py-0.5 transition-colors duration-200 hover:text-brand-800"
          >
            <Home size={14} className="inline align-[-2px]" />
          </Link>

          <ChevronLeft size={13} className="shrink-0 text-line-strong" />

          <span className="text-ink-soft">إعدادات الإشعارات</span>
        </nav>

        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
            <BellRing size={20} strokeWidth={2.1} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              إعدادات الإشعارات
            </h1>

            <p className="mt-0.5 text-[13px] text-muted">
              اختر ما تريد أن نُنبّهك بشأنه، وأوقف ما لا يهمّك.
            </p>
          </div>
        </header>

        <PreferencesCard
          query={preferencesQuery}
          mutation={updatePreferencesMutation}
          newListingsEnabled={newListingsEnabled}
        />

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <ListChecks
                  size={18}
                  strokeWidth={2.1}
                  aria-hidden="true"
                  className="text-brand-500"
                />
                الأقسام التي تتابعها
              </h2>

              {/* Only stated once the count is actually known — "لم تختر أي قسم"
                  while the read is in flight or failed would be a claim, not a
                  fact. */}
              {interestsQuery.isSuccess && (
                <p className="tnum mt-1 text-[13px] leading-6 text-muted">
                  {interests.length > 0
                    ? `تتابع ${formatNumber(interests.length)} ${
                        interests.length === 1 ? "قسمًا" : "أقسام"
                      } حاليًا.`
                    : "لم تختر أي قسم بعد."}
                </p>
              )}
            </div>

            {categories.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  loading={isBulkPending}
                  onClick={followEverySection}
                >
                  <LayoutGrid size={15} />
                  متابعة كل الأقسام
                </Button>

                {interests.length > 0 && (
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    disabled={isBulkPending}
                    onClick={() => setIsClearing(true)}
                  >
                    <Trash2 size={15} />
                    مسح الكل
                  </Button>
                )}
              </div>
            )}
          </div>

          {!newListingsEnabled && !preferencesQuery.isLoading && (
            <p className="mb-4 rounded-2xl border border-gold-200 bg-gold-50 px-4 py-3 text-[13px] leading-6 text-ink-soft">
              تنبيهات الإعلانات الجديدة موقوفة حاليًا. اختياراتك محفوظة، وستعود
              التنبيهات فور تفعيل الخيار بالأعلى.
            </p>
          )}

          {optionsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
                >
                  <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />

                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-24" />
                  </div>

                  <Skeleton className="h-6 w-6 shrink-0 rounded-md" />
                </div>
              ))}
            </div>
          ) : optionsQuery.isError ? (
            <ErrorState
              title="تعذّر تحميل الأقسام"
              description="حدث خطأ أثناء تحميل قائمة الاهتمامات. حاول مرة أخرى."
              onRetry={optionsQuery.refetch}
            />
          ) : categories.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="لا توجد أقسام متاحة"
              description="لم يتم إعداد أقسام يمكن متابعتها بعد."
            />
          ) : (
            <div
              className={`space-y-3 transition-opacity duration-200 ${
                isBulkPending ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {categories.map((category) => (
                <InterestCategoryCard
                  key={category.categoryId}
                  category={category}
                  pendingKeys={pendingKeys}
                  onToggle={toggleInterest}
                  onSetEnabled={(variables) =>
                    setInterestEnabledMutation.mutate(variables)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={isClearing}
        title="مسح كل الاهتمامات؟"
        description="سيتم إلغاء متابعة جميع الأقسام، ولن تصلك تنبيهات بالإعلانات الجديدة حتى تختار أقسامًا من جديد."
        confirmLabel="مسح الكل"
        loading={isBulkPending}
        onConfirm={clearEverySection}
        onClose={() => setIsClearing(false)}
      />
    </>
  );
}
