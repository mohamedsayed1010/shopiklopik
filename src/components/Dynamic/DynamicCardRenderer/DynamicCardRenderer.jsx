import { useContext, useMemo } from "react";
import { useParams } from "react-router-dom";

import ListingCard from "../../ui/ListingCard";
import PostInteractionBar from "../Interactions/PostInteractionBar";
import { buildListingCard } from "../../../utils/listingModel";
import { interactionCapabilities } from "../../../api/interactions/postInteractions";
import { AuthContext } from "../../../context/AuthContext";

export default function DynamicCardRenderer({ item, config }) {
  const { categoryId, subCategoryId } = useParams();

  const { user } = useContext(AuthContext);

  const interactions = useMemo(
    () => interactionCapabilities(config?.operations?.comments),
    [config]
  );

  const source = useMemo(
    () => ({
      key: config?.list?.endpoint ?? "listing",
      module: config?.module ?? null,
      interactionCollection: interactions.collection,
      categoryId: config?.category?.id ?? Number(categoryId),
      subCategoryId: config?.subCategory?.id ?? Number(subCategoryId),
      categoryName: config?.category?.nameAr ?? config?.category?.name,
      subCategoryName: config?.subCategory?.nameAr ?? config?.subCategory?.name,
    }),
    [config, categoryId, subCategoryId, interactions.collection]
  );

  const card = useMemo(() => {
    const built = buildListingCard(item, source);

    if (!built) return null;

    /* On this page the route is authoritative — the reader is inside one
       sub-category and must stay there. And a card only opens when the module
       actually publishes a details endpoint, exactly as before. */
    const canOpen = Boolean(config?.details?.endpoint && built.id);

    return {
      ...built,
      href: canOpen
        ? `/dynamic/${categoryId}/${subCategoryId}/${built.id}`
        : null,
    };
  }, [item, source, config, categoryId, subCategoryId]);

  if (!card) return null;

  const showInteractions = card.canLike || card.canComment;

  return (
    <ListingCard
      card={card}
      footer={
        showInteractions ? (
          <PostInteractionBar
            post={item}
            collection={interactions.collection}
            isPaginated={interactions.isPaginated}
            canDeleteComments={interactions.canDeleteComments}
            canUpdateComments={interactions.canUpdateComments}
            currentUserId={user?.id ?? null}
          />
        ) : null
      }
    />
  );
}
