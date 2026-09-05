import { useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../../components/Seo";
import { ChevronLeft, ChevronRight, Heart, Home } from "lucide-react";

import ListingCard from "../../components/ui/ListingCard";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import { ListingGridSkeleton } from "../../components/ui/Skeleton";
import useFavorites from "../../hooks/useFavorites";
import { formatNumber } from "../../utils/format";

function Pager({ pagination, onChange, isFetching }) {
  const { pageIndex, totalPages, hasNext, hasPrevious } = pagination;

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="تنقل بين الصفحات"
      className="mt-8 flex items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(pageIndex - 1)}
        disabled={!hasPrevious || isFetching}
        aria-label="الصفحة السابقة"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-[background-color,border-color,color] duration-300 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight size={17} strokeWidth={2.3} />
      </button>

      <span className="tnum px-3 text-[13.5px] font-semibold text-muted">
        {formatNumber(pageIndex)} / {formatNumber(totalPages)}
      </span>

      <button
        type="button"
        onClick={() => onChange(pageIndex + 1)}
        disabled={!hasNext || isFetching}
        aria-label="الصفحة التالية"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-[background-color,border-color,color] duration-300 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft size={17} strokeWidth={2.3} />
      </button>
    </nav>
  );
}

export default function FavoritesPage() {
  const [pageIndex, setPageIndex] = useState(1);

  const { items, pagination, isLoading, isFetching, isError, refetch } =
    useFavorites({ pageIndex });

  return (
    <>
      <Seo title="المفضلة" />

      <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
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

          <span className="text-ink-soft">المفضلة</span>
        </nav>

        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
            <Heart size={20} strokeWidth={2.1} />
          </span>

          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              المفضلة
            </h1>

            {pagination.totalCount > 0 && (
              <p className="tnum mt-0.5 text-[13px] text-muted">
                {formatNumber(pagination.totalCount)} إعلان محفوظ
              </p>
            )}
          </div>
        </header>

        {isLoading ? (
          <ListingGridSkeleton count={8} />
        ) : isError ? (
          <ErrorState
            title="تعذّر تحميل المفضلة"
            description="ربما حدث خطأ في الاتصال. حاول مرة أخرى."
            onRetry={refetch}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="لا توجد إعلانات في المفضلة"
            description="اضغط على القلب في أي إعلان ليظهر هنا وتعود إليه بسهولة."
            action={
              <Link
                to="/"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-900 px-5 py-2.5 text-[13.5px] font-bold text-white transition-colors duration-300 hover:bg-brand-800"
              >
                تصفّح الإعلانات
              </Link>
            }
          />
        ) : (
          <>
            <div
              /* `items-start` so a lone card on the last row keeps its own
                 height instead of stretching to fill the track. */
              className={`grid grid-cols-1 items-start gap-5 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                isFetching ? "opacity-60" : ""
              }`}
            >
              {items.map((card) => (
                <ListingCard key={card.id} card={card} />
              ))}
            </div>

            <Pager
              pagination={pagination}
              onChange={setPageIndex}
              isFetching={isFetching}
            />
          </>
        )}
      </div>
    </>
  );
}
