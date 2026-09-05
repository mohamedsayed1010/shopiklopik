import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "../../components/Seo";
import { sectionDescription } from "../../seo/descriptions";
import {
  ChevronRight,
  ChevronLeft,
  PackageSearch,
  Plus,
  Share2,
} from "lucide-react";

import useReadConfig from "../../hooks/useReadConfig";
import useDynamicOptions from "../../hooks/useDynamicOptions";
import useMarketplaceGovernorate from "../../hooks/useMarketplaceGovernorate";
import useAdvertiserOptions from "../../hooks/useAdvertiserOptions";
import useDynamicFilters from "../../hooks/useDynamicFilters";
import useDynamicList from "../../hooks/useDynamicList";
import useCharityModule from "../../hooks/charity/useCharityModule";

import CharityListPage from "../Charity/CharityListPage";
import DynamicFilterRenderer from "../../components/Dynamic/DynamicFilters/index";
import DynamicCardRenderer from "../../components/Dynamic/DynamicCardRenderer/DynamicCardRenderer";
import SocialPostCard from "../../components/Charity/SocialPostCard";
import { interactionCapabilities } from "../../api/interactions/postInteractions";
import PageHeader from "../../components/ui/PageHeader";
import BannerSlot from "../../components/banners/BannerSlot";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ShareModal from "../../components/ui/ShareModal";
import { ListingGridSkeleton, Skeleton } from "../../components/ui/Skeleton";
import { formatNumber } from "../../utils/format";
import { selectClass } from "../../components/ui/formStyles";
import { advertiserFilter, hiddenFilterNames } from "../../utils/filterPanel";
import { PLACEMENT_KEYS } from "../../utils/bannerPlacements";
import useCreateAdTarget from "../../hooks/useCreateAdTarget";

/** Stable empties, so a section without an advertiser picker never re-renders. */
const NO_FIELDS = [];

function MarketplaceListPage() {
  /* This page *is* a sub-category, so the button opens that exact form — see
     `useCreateAdTarget`, which reads both ids from the address. */
  const createAdTarget = useCreateAdTarget();

  const { categoryId, subCategoryId } = useParams();

  const {
    config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    refetch: refetchConfig,
  } = useReadConfig(Number(categoryId), Number(subCategoryId));

  const endpoint = useMemo(() => config?.list?.endpoint ?? "", [config]);

  /* This module's interaction surface, straight from read-config — the same
     resolution the cards and the details page use. */
  const interactions = useMemo(
    () => interactionCapabilities(config?.operations?.comments),
    [config]
  );

  const isSocial = Boolean(interactions.collection);

  const advertiser = advertiserFilter(config);

  /* The config decides what this list asks for: its endpoint, the filters the
     panel offers, and — through `list.query` — the parameters the backend
     fixes for this sub-category and that every request must carry. */
  const {
    filters,
    pinned,
    query,
    hasFilters,
    setFilter,
    resetFilters,
    changePage,
    changePageSize,
  } = useDynamicFilters(config, {
    resetKey: `${categoryId}/${subCategoryId}`,
  });

  const { options: advertisers, isLoading: isAdvertisersLoading } =
    useAdvertiserOptions(endpoint, { enabled: Boolean(advertiser) });

  const extraFields = useMemo(() => {
    if (!advertiser) return NO_FIELDS;

    return [
      {
        key: "advertiser",
        name: advertiser.parameter,
        label: advertiser.label,
        type: "enum",
        options: advertisers,
        optionsSource: "advertiser",
        disabled: !advertisers.length && !isAdvertisersLoading,
      },
    ];
  }, [advertiser, advertisers, isAdvertisersLoading]);

  const { governorateId } = useMarketplaceGovernorate();

  const lookupValues = useMemo(
    () => ({
      ...(governorateId === null ? {} : { governorateId }),
      ...filters,
    }),
    [governorateId, filters]
  );

  /* Options for a control the panel never renders are options nobody sees, so
     the lookups behind hidden and pinned parameters are not requested. */
  const unusedLookups = useMemo(
    () => new Set([...hiddenFilterNames(config), ...Object.keys(pinned)]),
    [config, pinned]
  );

  const { options, optionsStatus } = useDynamicOptions(config, lookupValues, {
    skipFields: unusedLookups,
  });

  /* The advertiser list is read from the listings, not from a lookup, so its
     loading state is merged in under the source name the field declares. */
  const fieldOptionsStatus = useMemo(
    () => ({
      ...optionsStatus,
      advertiser: { isLoading: isAdvertisersLoading, isError: false },
    }),
    [optionsStatus, isAdvertisersLoading]
  );

  const {
    items,
    pagination,
    isLoading: isListLoading,
    isFetching,
    isError: isListError,
    refetch: refetchList,
  } = useDynamicList(endpoint, query);

  const title =
    config?.subCategory?.nameAr ?? config?.category?.nameAr ?? "الإعلانات";

  const [isShareOpen, setShareOpen] = useState(false);

  const sharedAdvertiser = advertiser
    ? String(filters?.[advertiser.parameter] ?? "").trim() || null
    : null;

  if (isConfigLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />

        <div className="mt-8">
          <ListingGridSkeleton />
        </div>
      </div>
    );
  }

  if (isConfigError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState
          title="تعذّر فتح هذا القسم"
          description="لم نتمكن من تحميل بيانات القسم. حاول مرة أخرى بعد قليل."
          onRetry={refetchConfig}
        />
      </div>
    );
  }

  return (
    <>
      {/* The section-s own names, as the config publishes them — the site
          name is appended by `Seo` from the settings rather than spelled out. */}
      <Seo
        title={title}
        description={sectionDescription({
          categoryName: config?.category?.nameAr ?? config?.category?.name,
          subCategoryName:
            config?.subCategory?.nameAr ?? config?.subCategory?.name,
          label: config?.list?.label,
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          title={title}
          subtitle={config?.list?.label}
          className="mb-6"
          action={
            // Phones already have the bottom-bar "add" action — no duplicate.
            <Button
              as={Link}
              to={createAdTarget}
              variant="gold"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Plus size={17} strokeWidth={2.5} />
              أضف إعلانك
            </Button>
          }
        />

        <BannerSlot
          placementKey={PLACEMENT_KEYS.subCategory}
          categoryId={categoryId}
          subCategoryId={subCategoryId}
          className="mb-6 max-lg:sticky max-lg:top-[69px] max-lg:z-20"
        />

        <DynamicFilterRenderer
          config={config}
          options={options}
          optionsStatus={fieldOptionsStatus}
          extraFields={extraFields}
          filters={filters}
          pinned={pinned}
          setFilter={setFilter}
          onReset={resetFilters}
          className="mb-6"
        />

        {/* Result summary */}
        {!isListLoading && !isListError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p className="text-sm text-muted">
              <span className="tnum font-semibold text-ink">
                {formatNumber(pagination.totalCount)}
              </span>{" "}
              نتيجة
            </p>

            <div className="flex items-center gap-3">
              {isFetching && (
                <span className="flex items-center gap-2 text-xs text-muted">
                  <Spinner size="sm" className="text-brand-400" />
                  جارٍ التحديث
                </span>
              )}

              {sharedAdvertiser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 size={15} strokeWidth={2.2} />
                  مشاركة نتائج المعلن
                </Button>
              )}
            </div>
          </div>
        )}

        <ShareModal
          open={isShareOpen}
          onClose={() => setShareOpen(false)}
          title={
            sharedAdvertiser ? `${title} — ${sharedAdvertiser}` : title
          }
        />

        {isListLoading ? (
          <ListingGridSkeleton />
        ) : isListError ? (
          <ErrorState onRetry={refetchList} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="لا توجد إعلانات مطابقة"
            description={
              hasFilters
                ? "جرّب توسيع نطاق البحث بإزالة بعض الفلاتر."
                : "لم يتم نشر أي إعلان في هذا القسم بعد. كن أول من ينشر."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={resetFilters}>
                  مسح الفلاتر
                </Button>
              ) : (
                <Button as={Link} to={createAdTarget} variant="gold">
                  <Plus size={18} strokeWidth={2.5} />
                  أضف إعلانك
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Small screens, post modules only: one centred column of social
                cards. A question's or a lost-item's content is its text, and a
                three-across grid truncates all of it on a phone. */}
            {isSocial && (
              <div
                className={`mx-auto flex max-w-2xl flex-col gap-4 transition-opacity duration-200 md:hidden ${
                  isFetching ? "opacity-60" : "opacity-100"
                }`}
              >
                {items.map((item, index) => (
                  <SocialPostCard
                    key={item.id ?? item.ownerId ?? index}
                    item={item}
                    config={config}
                    collection={interactions.collection}
                    isPaginated={interactions.isPaginated}
                    canDeleteComments={interactions.canDeleteComments}
                    canUpdateComments={interactions.canUpdateComments}
                  />
                ))}
              </div>
            )}

            {/* The existing grid, unchanged for every section. For the two post
                modules it simply starts at `md` instead of at zero, so their
                desktop appearance is exactly what it was. */}
            <div
              className={`grid-cols-1 gap-5 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 ${
                isSocial ? "hidden md:grid" : "grid"
              } ${isFetching ? "opacity-60" : "opacity-100"}`}
            >
              {items.map((item, index) => (
                <DynamicCardRenderer
                  key={item.id ?? item.ownerId ?? index}
                  item={item}
                  config={config}
                />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!isListLoading && pagination.totalPages > 1 && (
          <nav
            aria-label="التنقل بين الصفحات"
            className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-line pt-8"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevious}
              onClick={() => changePage(pagination.pageIndex - 1)}
            >
              <ChevronRight size={16} />
              السابق
            </Button>

            <span className="tnum px-2 text-sm text-muted">
              صفحة{" "}
              <span className="font-semibold text-ink">
                {pagination.pageIndex}
              </span>{" "}
              من {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => changePage(pagination.pageIndex + 1)}
            >
              التالي
              <ChevronLeft size={16} />
            </Button>

            <div className="relative ms-2">
              <select
                aria-label="عدد النتائج في الصفحة"
                value={query.pageSize}
                onChange={(event) =>
                  changePageSize(Number(event.target.value))
                }
                className={`${selectClass()} tnum h-9 py-0 text-sm`}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={36}>36</option>
                <option value={48}>48</option>
              </select>

              <ChevronLeft
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 -rotate-90 text-muted end-3"
              />
            </div>
          </nav>
        )}
      </div>
    </>
  );
}

export default function DynamicListPage() {
  const { categoryId, subCategoryId } = useParams();

  const { module, isResolved } = useCharityModule(
    Number(categoryId),
    Number(subCategoryId)
  );

  if (!isResolved) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />

        <div className="mt-8">
          <ListingGridSkeleton />
        </div>
      </div>
    );
  }

  if (module) return <CharityListPage key={module.route} module={module} />;

  return <MarketplaceListPage />;
}
