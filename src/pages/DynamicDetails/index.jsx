import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Seo from "../../components/Seo";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { listingDescription, listingTitle } from "../../seo/descriptions";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

import useReadConfig from "../../hooks/useReadConfig";
import useDynamicDetails from "../../hooks/useDynamicDetails";
import useDynamicOptions from "../../hooks/useDynamicOptions";
import useAdSchema from "../../hooks/useAdSchema";
import useListingModuleType from "../../hooks/useListingModuleType";
import useAdvertisementView from "../../hooks/useAdvertisementView";
import useCharityModule from "../../hooks/charity/useCharityModule";

import CharityDetailsPage from "../Charity/CharityDetailsPage";
import DynamicDetailsRenderer from "../../components/Dynamic/DynamicDetailsRenderer";
import DetailsSkeleton from "../../components/Dynamic/Details/DetailsSkeleton";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";

function Crumb({ to, children }) {
  return (
    <Link
      to={to}
      className="shrink-0 rounded-md px-1 py-0.5 transition-colors duration-200 hover:text-brand-800"
    >
      {children}
    </Link>
  );
}

function MarketplaceDetailsPage() {
  const { categoryId, subCategoryId, id } = useParams();

  const navigate = useNavigate();

  const {
    config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    refetch: refetchConfig,
  } = useReadConfig(Number(categoryId), Number(subCategoryId));

  const endpoint = useMemo(() => {
    if (!config?.details?.endpoint) return "";

    return config.details.endpoint.replace("{id}", id);
  }, [config, id]);

  const { item, isLoading, isError, refetch } = useDynamicDetails(endpoint);

  const { options } = useDynamicOptions(config, item);

  const { schema } = useAdSchema(
    Number(categoryId),
    Number(subCategoryId),
    config
  );

  const { type: moduleType, isResolved: isModuleTypeResolved } =
    useListingModuleType(Number(categoryId), Number(subCategoryId));

  const { totalViews } = useAdvertisementView({
    id: item ? item.id ?? id : null,
    type: moduleType,
    enabled: isModuleTypeResolved,
  });

  const categoryName = config?.category?.nameAr ?? config?.category?.name;

  const subCategoryName = config?.subCategory?.nameAr ?? config?.subCategory?.name;

  const pageTitle =
    item?.title ??
    item?.adTitle ??
    item?.itemName ??
    item?.name ??
    subCategoryName ??
    "تفاصيل الإعلان";

  const shareImage = (() => {
    const gallery = Array.isArray(item?.images) ? item.images : [];

    const first = gallery
      .map((entry) => (typeof entry === "string" ? entry : entry?.url))
      .find(Boolean);

    const candidate = item?.primaryImageUrl || first || item?.imageUrl;

    return candidate ? resolveMediaUrl(candidate) : "";
  })();

  const isBusy = isConfigLoading || isLoading;

  return (
    <>
      <Seo
        title={listingTitle({ title: pageTitle, subCategoryName })}
        description={listingDescription({
          item,
          title: pageTitle,
          categoryName,
          subCategoryName,
        })}
        image={shareImage}
        type="article"
      />

      {/* Ambient wash. The page's cards are frosted, so they need something
          behind them to frost — a flat canvas would make the glass invisible. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
        >
          <span className="absolute -top-32 h-[420px] w-[420px] animate-blob-drift rounded-full bg-brand-200/45 blur-[110px] start-[-6rem]" />

          <span className="absolute -top-20 h-[380px] w-[380px] animate-blob-drift rounded-full bg-gold-200/45 blur-[110px] end-[-5rem]" />

          <span className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-16">
          <nav
            aria-label="مسار التصفح"
            className="mb-5 flex items-center gap-1 text-[13px] font-medium text-muted"
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="-ms-2 me-1 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-900"
            >
              <ChevronRight size={17} />
              رجوع
            </button>

            <span aria-hidden="true" className="text-line-strong">
              |
            </span>

            <div className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto">
              <Crumb to="/">
                <Home size={14} className="inline align-[-2px]" />
              </Crumb>

              {categoryName && (
                <>
                  <ChevronLeft size={13} className="shrink-0 text-line-strong" />

                  <Crumb to={`/category/${categoryId}`}>{categoryName}</Crumb>
                </>
              )}

              {subCategoryName && (
                <>
                  <ChevronLeft size={13} className="shrink-0 text-line-strong" />

                  <Crumb to={`/dynamic/${categoryId}/${subCategoryId}`}>
                    {subCategoryName}
                  </Crumb>
                </>
              )}
            </div>
          </nav>

          {isBusy ? (
            <DetailsSkeleton />
          ) : isConfigError || isError ? (
            <ErrorState
              title="تعذّر تحميل الإعلان"
              description="ربما تم حذف هذا الإعلان أو حدث خطأ في الاتصال."
              onRetry={isConfigError ? refetchConfig : refetch}
            />
          ) : !item ? (
            <EmptyState
              title="الإعلان غير متاح"
              description="لم نعثر على هذا الإعلان. ربما تم حذفه بواسطة صاحبه."
            />
          ) : (
            <DynamicDetailsRenderer
              /* Router keeps this component mounted when only `:id` changes,
                 so following a related ad would otherwise inherit the previous
                 one's gallery slide and save state. */
              key={id}
              data={item}
              config={config}
              /* The exact string this page's cache entry is keyed by, so a
                 mutation writing the server's answer back lands on the entry
                 being displayed rather than beside it. */
              endpoint={endpoint}
              options={options}
              schema={schema}
              views={totalViews}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function DynamicDetailsPage() {
  const { categoryId, subCategoryId } = useParams();

  const { module, isResolved } = useCharityModule(
    Number(categoryId),
    Number(subCategoryId)
  );

  if (!isResolved) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DetailsSkeleton />
      </div>
    );
  }

  if (module) return <CharityDetailsPage key={module.route} module={module} />;

  return <MarketplaceDetailsPage />;
}
