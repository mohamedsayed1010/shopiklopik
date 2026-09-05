import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import ListingRail from "../../ui/ListingRail";
import ListingCard from "../../ui/ListingCard";
import ErrorState from "../../ui/ErrorState";
import useReadConfig from "../../../hooks/useReadConfig";
import useDynamicList from "../../../hooks/useDynamicList";
import { buildListingCard } from "../../../utils/listingModel";

/** Enough to fill the rail and scroll a little; never a whole page of rows. */
const RAIL_SIZE = 10;

const MIN_CARDS = 2;

export default function HomeListingSection({
  title,
  subtitle,
  categoryId,
  subCategoryId,
}) {
  const {
    config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    refetch: refetchConfig,
  } = useReadConfig(categoryId, subCategoryId);

  const endpoint = config?.list?.endpoint ?? "";

  const params = useMemo(
    () => ({
      ...(config?.list?.query ?? {}),
      pageIndex: 1,
      pageSize: RAIL_SIZE,
    }),
    [config]
  );

  const {
    items,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useDynamicList(endpoint, params);

  const source = useMemo(
    () => ({
      key: endpoint || `home:${categoryId}/${subCategoryId}`,
      module: config?.module ?? null,
      categoryId,
      subCategoryId,
      categoryName: config?.category?.nameAr ?? config?.category?.name,
      subCategoryName: config?.subCategory?.nameAr ?? config?.subCategory?.name,
    }),
    [endpoint, config, categoryId, subCategoryId]
  );

  const cards = useMemo(
    () => items.map((item) => buildListingCard(item, source)).filter(Boolean),
    [items, source]
  );

  const isLoading = isConfigLoading || (Boolean(endpoint) && isListLoading);

  const isError = isConfigError || isListError;

  const to = `/dynamic/${categoryId}/${subCategoryId}`;

  /* The section's own listing page — the route the app already serves, built
     from the pair this section was resolved to. */
  const viewAll = (
    <Link
      to={to}
      className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-brand-800 transition-colors duration-300 hover:bg-brand-50 hover:text-brand-950"
    >
      عرض الكل
      <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
    </Link>
  );

  if (isError) {
    return (
      <ListingRail title={title} subtitle={subtitle} action={viewAll}>
        <ErrorState
          title="تعذّر تحميل هذا القسم"
          description="تحقّق من اتصالك بالإنترنت وحاول مرة أخرى."
          onRetry={() => {
            refetchConfig();
            refetchList();
          }}
          className="w-full"
        />
      </ListingRail>
    );
  }

  if (!isLoading && cards.length < MIN_CARDS) return null;

  return (
    <ListingRail
      title={title}
      subtitle={subtitle}
      action={viewAll}
      isLoading={isLoading}
      skeletonCount={4}
    >
      {cards.map((card) => (
        <div
          key={card.key}
          className="w-[236px] shrink-0 snap-start sm:w-[256px]"
        >
          <ListingCard card={card} variant="compact" />
        </div>
      ))}
    </ListingRail>
  );
}
