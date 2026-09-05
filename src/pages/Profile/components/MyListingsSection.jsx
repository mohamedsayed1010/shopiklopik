import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, PackageOpen, Plus } from "lucide-react";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { Skeleton } from "../../../components/ui/Skeleton";
import MyListingCard from "./MyListingCard";
import { useListingActions, useMyListings } from "../useMyListings";
import useListingRoutes from "../../../hooks/useListingRoutes";
import useReadConfigs from "../../../hooks/useReadConfigs";
import { formatNumber } from "../../../utils/format";
import useUrlState, { urlPositiveInt } from "../../../hooks/useUrlState";

const PAGE_SIZE = 6;

const URL_STATE = {
  page: { defaultValue: 1, parse: urlPositiveInt },
};

function ListingRowSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs sm:flex-row">
      <Skeleton className="aspect-[16/10] w-full rounded-none sm:aspect-auto sm:h-40 sm:w-52" />

      <div className="flex-1 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2.5 h-4 w-3/5" />

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-4">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, onChange, disabled }) {
  const totalPages = Number(page?.totalPages) || 0;

  if (totalPages <= 1) return null;

  const current = Number(page?.pageIndex) || 1;

  return (
    <nav
      aria-label="تنقّل بين صفحات إعلاناتك"
      className="mt-6 flex items-center justify-center gap-2"
    >
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || !page?.hasPrevious}
        onClick={() => onChange(current - 1)}
      >
        <ChevronRight size={16} />
        السابق
      </Button>

      <span className="tnum px-3 text-[13px] font-semibold text-ink-soft">
        {current} / {totalPages}
      </span>

      <Button
        size="sm"
        variant="outline"
        disabled={disabled || !page?.hasNext}
        onClick={() => onChange(current + 1)}
      >
        التالي
        <ChevronLeft size={16} />
      </Button>
    </nav>
  );
}

export default function MyListingsSection() {
  const { values, setValues } = useUrlState(URL_STATE);

  const pageIndex = values.page;

  const setPageIndex = useCallback(
    (next) =>
      setValues({
        page: typeof next === "function" ? next(pageIndex) : next,
      }),
    [setValues, pageIndex]
  );

  const [pendingDelete, setPendingDelete] = useState(null);

  const { listings, page, isLoading, isFetching, isError, refetch } = useMyListings({
    pageIndex,
    pageSize: PAGE_SIZE,
  });

  const unresolved = useMemo(
    () =>
      listings
        .filter(
          (listing) =>
            !(listing.categoryId && listing.subCategoryId && listing.route)
        )
        .map((listing) => listing.type),
    [listings]
  );

  const { resolve } = useListingRoutes(unresolved);

  const { configFor } = useReadConfigs(listings);

  const { deleteMutation, republishMutation } = useListingActions();

  const total = Number(page?.totalCount);

  return (
    <section id="my-listings" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-ink">إعلاناتي</h2>

          {Number.isFinite(total) && total > 0 && (
            <p className="mt-0.5 text-[13px] text-muted">
              {formatNumber(total)} إعلان منشور على حسابك
            </p>
          )}
        </div>

        <Button as={Link} to="/create-product" size="sm" variant="outline">
          <Plus size={15} />
          إعلان جديد
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ListingRowSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="تعذّر تحميل إعلاناتك"
          description="حدث خطأ أثناء جلب قائمة إعلاناتك. حاول مرة أخرى."
          onRetry={refetch}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="لا توجد إعلانات بعد"
          description="ابدأ بنشر أول إعلان لك وسيظهر هنا مع حالته ومدة صلاحيته."
          action={
            <Button as={Link} to="/create-product">
              <Plus size={17} />
              أضف إعلانك الأول
            </Button>
          }
        />
      ) : (
        <>
          {/* Page swaps keep the previous rows on screen; dimming them is the
              only signal needed that fresher data is on the way. */}
          <div
            className={`grid gap-4 transition-opacity duration-200 ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {listings.map((listing) => {
              const isDeleting =
                deleteMutation.isPending &&
                deleteMutation.variables?.id === listing.id;

              const isRepublishing =
                republishMutation.isPending &&
                republishMutation.variables?.id === listing.id;

              return (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  route={resolve(listing.type)}
                  config={configFor(listing.categoryId, listing.subCategoryId)}
                  isDeleting={isDeleting}
                  isRepublishing={isRepublishing}
                  onDelete={(item, endpoint) =>
                    setPendingDelete({ id: item.id, title: item.title, endpoint })
                  }
                  onRepublish={(item, endpoint) =>
                    republishMutation.mutate({ id: item.id, endpoint })
                  }
                />
              );
            })}
          </div>

          <Pagination page={page} onChange={setPageIndex} disabled={isFetching} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="حذف الإعلان؟"
        description={
          pendingDelete?.title
            ? `سيتم حذف «${pendingDelete.title}» نهائيًا ولا يمكن التراجع عن ذلك.`
            : "سيتم حذف هذا الإعلان نهائيًا ولا يمكن التراجع عن ذلك."
        }
        confirmLabel="نعم، احذف"
        loading={deleteMutation.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;

          // Removing the only row on a trailing page would strand the user on
          // a page that no longer exists — step back as part of the action.
          const wasLastOnPage = listings.length === 1 && pageIndex > 1;

          deleteMutation.mutate(
            { id: pendingDelete.id, endpoint: pendingDelete.endpoint },
            {
              onSuccess: () => {
                if (wasLastOnPage) setPageIndex((current) => current - 1);
              },
              onSettled: () => setPendingDelete(null),
            }
          );
        }}
      />
    </section>
  );
}
