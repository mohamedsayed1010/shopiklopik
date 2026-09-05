import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import AdGallery from "./Details/AdGallery";
import AdHeader from "./Details/AdHeader";
import AdPriceCard from "./Details/AdPriceCard";
import AdDescription from "./Details/AdDescription";
import AdSpecs from "./Details/AdSpecs";
import AdActionBar from "./Details/AdActionBar";
import AdInfoCard from "./Details/AdInfoCard";
import AdRating from "./Details/AdRating";
import SellerCard from "./Details/SellerCard";
import SafetyCard from "./Details/SafetyCard";
import SimilarAds from "./Details/SimilarAds";
import ReportModal from "./Details/ReportModal";
import ReturnedStatus from "./Details/ReturnedStatus";
import MobileContactBar from "./Details/MobileContactBar";
import CommentsDrawer from "./Interactions/CommentsDrawer";

import useSimilarAdvertisements from "../../hooks/useSimilarAdvertisements";
import useListingModuleType from "../../hooks/useListingModuleType";
import useAdvertisementActions from "../../hooks/useAdvertisementActions";
import { buildAdModel } from "../../utils/adModel";
import { collectionOf, fillEndpoint } from "../../utils/listingEndpoint";
import { interactionCapabilities } from "../../api/interactions/postInteractions";
import { AuthContext } from "../../context/AuthContext";

export default function DynamicDetailsRenderer({
  data,
  config,
  options = {},
  schema,
  views = null,
  /** The address this payload was read from — see the details page. */
  endpoint = "",
}) {
  /* A comment notification links here as `?focus=comments`, so arriving from
     one lands on the post *and* opens the thread — the notification said
     someone replied, and the reply should be on screen. */
  const [searchParams, setSearchParams] = useSearchParams();

  const wantsComments = searchParams.get("focus") === "comments";

  const [isReportOpen, setReportOpen] = useState(false);
  const [isCommentsOpen, setCommentsOpen] = useState(wantsComments);
  const [hasOpenedComments, setHasOpenedComments] = useState(wantsComments);

  const built = useMemo(
    () => buildAdModel({ data, config, schema, options }),
    [data, config, schema, options]
  );

  const model = useMemo(() => {
    if (!built) return null;

    if (!Number.isFinite(views)) return built;

    return { ...built, meta: { ...built.meta, views } };
  }, [built, views]);

  const categoryId = data?.categoryId ?? config?.category?.id ?? null;

  const subCategoryId = data?.subCategoryId ?? config?.subCategory?.id ?? null;

  /* The module type a report has to name, resolved the same way the view and
     favourite calls resolve theirs — from the interaction metadata, which is
     one cached query shared by all three. */
  const { type: moduleType } = useListingModuleType(categoryId, subCategoryId);

  /* Only used to decide whether a comment is this reader's own, which is what
     gates the delete affordance where the collection supports one. */
  const { user } = useContext(AuthContext);

  const { actions, isLoading: isLoadingActions } = useAdvertisementActions({
    id: data?.id,
    type: moduleType,
  });

  const interactions = useMemo(
    () => interactionCapabilities(config?.operations?.comments),
    [config]
  );

  const supportsComments = Boolean(interactions.collection);

  const supportsLikes = supportsComments && "likesCount" in (data ?? {});

  const hasReported = actions?.hasReported === true;

  const canOpenReport =
    !hasReported && (actions ? actions.canReport !== false : true);

  const detailsTemplate = config?.details?.endpoint ?? "";

  const supportsReturned = collectionOf(detailsTemplate) === "lost-found";

  /* The page hands down the address it read this payload from; the template is
     only filled in as a fallback. */
  const recordEndpoint = endpoint || fillEndpoint(detailsTemplate, data?.id);

  const {
    items: similarItems,
    pagination: similarPagination,
    isLoading: isSimilarLoading,
    isError: isSimilarError,
    hasMore: hasMoreSimilar,
    isLoadingMore: isLoadingMoreSimilar,
    loadMore: loadMoreSimilar,
  } = useSimilarAdvertisements({
    id: data?.id,
    type: moduleType,
    /* The same (category, sub-category) the type above was resolved from, so
       the hook can settle it itself while the metadata query is still in
       flight. It is one shared cached query either way. */
    categoryId,
    subCategoryId,
  });

  const openComments = useCallback(() => {
    setHasOpenedComments(true);
    setCommentsOpen(true);
  }, []);

  /* The parameter is consumed once and stripped, so closing the sheet and
     reloading, or sharing the URL, does not reopen it. `replace` keeps the
     stripped URL out of history: Back should leave the page, not the query. */
  useEffect(() => {
    if (!wantsComments) return;

    const next = new URLSearchParams(searchParams);

    next.delete("focus");

    setSearchParams(next, { replace: true });
  }, [wantsComments, searchParams, setSearchParams]);

  if (!model) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Main column */}
        <div className="stagger space-y-5 lg:col-span-8">
          <AdGallery
            images={model.images}
            videos={model.videos}
            title={model.title}
          />

          <AdHeader
            model={model}
            hasReported={hasReported}
            onReport={canOpenReport ? () => setReportOpen(true) : undefined}
          />

          {/* Categories that never ask for a price (a lost wallet, a found
              set of keys) get no plate at all — not an empty one. */}
          {model.priceApplicable && <AdPriceCard price={model.price} />}

          <AdActionBar
            adId={data.id}
            title={model.title}
            likes={model.meta.likes}
            comments={model.meta.comments}
            isLiked={data.isLikedByCurrentUser ?? false}
            isFavorite={
              actions ? actions.isFavorite === true : data.isFavorite === true
            }
            favoriteCount={
              Number.isFinite(Number(actions?.favoriteCount))
                ? Number(actions.favoriteCount)
                : Number.isFinite(Number(data.favoriteCount))
                  ? Number(data.favoriteCount)
                  : null
            }
            isLoadingFavorite={isLoadingActions}
            canFavorite={actions ? actions.canFavorite !== false : true}
            moduleType={moduleType}
            categoryId={categoryId}
            subCategoryId={subCategoryId}
            interactionCollection={interactions.collection}
            supportsLikes={supportsLikes}
            supportsComments={supportsComments}
            onOpenComments={openComments}
          />

          {/* Whether the search is over — and, for the owner, the way to say so.
              Sits directly under the action rail because it is the one thing
              about a lost-and-found post that outranks its details. */}
          {supportsReturned && (
            <ReturnedStatus
              post={data}
              detailsEndpoint={recordEndpoint}
              /* The server's answer to "is this mine?", never a local guess. */
              isOwner={actions?.isOwner === true}
            />
          )}

          {/* The seller sits inline on phones, right where the decision is
              made; from lg it lives in the sticky sidebar instead. */}
          <div className="lg:hidden">
            <SellerCard seller={model.seller} postedAt={model.meta.createdAt} />
          </div>

          <AdDescription text={model.description} />

          <AdSpecs
            groups={model.specGroups}
            chipGroups={model.chipGroups}
            objectGroups={model.objectGroups}
          />

          <div className="lg:hidden">
            <AdInfoCard meta={model.meta} />
          </div>

          <AdRating
            id={data.id}
            type={moduleType}
            categoryId={categoryId}
            subCategoryId={subCategoryId}
          />

          <SimilarAds
            items={similarItems}
            isLoading={isSimilarLoading}
            isError={isSimilarError}
            totalCount={similarPagination.totalCount}
            hasMore={hasMoreSimilar}
            isLoadingMore={isLoadingMoreSimilar}
            onLoadMore={loadMoreSimilar}
          />

          <div className="lg:hidden">
            <SafetyCard />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:col-span-4 lg:block">
          <div className="stagger space-y-5 lg:sticky lg:top-24">
            <SellerCard seller={model.seller} postedAt={model.meta.createdAt} />

            <AdInfoCard meta={model.meta} />

            <SafetyCard />
          </div>
        </aside>
      </div>

      <MobileContactBar seller={model.seller} />

      <ReportModal
        /* A report filed from another tab (or the answer simply arriving late)
           closes the form rather than letting a second one be submitted. */
        open={isReportOpen && !hasReported}
        onClose={() => setReportOpen(false)}
        adId={data.id}
        type={moduleType}
        adTitle={model.title}
      />

      {/* Mounted on first open and kept mounted, so the exit animation has
          something to animate out of. */}
      {supportsComments && hasOpenedComments && (
        <CommentsDrawer
          open={isCommentsOpen}
          onClose={() => setCommentsOpen(false)}
          postId={data.id}
          collection={interactions.collection}
          isPaginated={interactions.isPaginated}
          canDeleteComments={interactions.canDeleteComments}
          canUpdateComments={interactions.canUpdateComments}
          currentUserId={user?.id ?? null}
        />
      )}
    </>
  );
}
