import { useCallback, useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  MessageCircle,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";

import LikeButton from "../Dynamic/Interactions/LikeButton";
import CommentsDrawer from "../Dynamic/Interactions/CommentsDrawer";
import ShareModal from "../ui/ShareModal";
import ConfirmDialog from "../ui/ConfirmDialog";
import Image from "../ui/Image";
import { AuthContext } from "../../context/AuthContext";
import { useListingActions } from "../../pages/Profile/useMyListings";
import { buildListingCard } from "../../utils/listingModel";
import { listingEndpoint } from "../../utils/listingEndpoint";
import { formatNumber } from "../../utils/format";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { avatarHue, initialsFrom } from "../../utils/adModel";

/** "3 إعجاب · 4 تعليق", omitting whichever is zero. */
function countsLine(likes, comments) {
  const parts = [];

  if (likes > 0) parts.push(`${formatNumber(likes)} إعجاب`);

  if (comments > 0) parts.push(`${formatNumber(comments)} تعليق`);

  return parts.join(" · ");
}

function OwnerMenu({ editHref, onDelete, isDeleting }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="خيارات المنشور"
        className="-me-1 cursor-pointer rounded-full p-2 text-muted transition-colors duration-200 hover:bg-canvas hover:text-ink"
      >
        <MoreVertical size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          {/* Tapping anywhere else closes it — no outside-click listener. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />

          <div
            role="menu"
            className="absolute end-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
          >
            {editHref && (
              <Link
                to={editHref}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-ink transition-colors duration-200 hover:bg-canvas"
              >
                <Pencil size={15} strokeWidth={2} aria-hidden="true" />
                تعديل
              </Link>
            )}

            <button
              type="button"
              role="menuitem"
              disabled={isDeleting}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
              حذف
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SocialPostCard({
  item,
  config,
  collection,
  isPaginated = false,
  canDeleteComments = false,
  canUpdateComments = false,
}) {
  const { user } = useContext(AuthContext);

  const queryClient = useQueryClient();

  const { deleteMutation } = useListingActions();

  const [isCommentsOpen, setCommentsOpen] = useState(false);
  const [hasOpenedComments, setHasOpenedComments] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);

  /* Seeded from the row, then owned locally: posting or deleting a comment
     moves the count without refetching the page of results. */
  const [commentsCount, setCommentsCount] = useState(
    Number(item?.commentsCount) || 0
  );

  const card = buildListingCard(item, {
    key: config?.list?.endpoint ?? "listing",
    module: config?.module ?? null,
    interactionCollection: collection,
    categoryId: config?.category?.id,
    subCategoryId: config?.subCategory?.id,
  });

  const openComments = useCallback(() => {
    setHasOpenedComments(true);
    setCommentsOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    setConfirmingDelete(false);

    const endpoint = listingEndpoint({
      detailsEndpoint: config?.details?.endpoint,
      route: item?.route,
      id: item?.id,
    });

    if (!endpoint) return;

    await deleteMutation.mutateAsync({ endpoint }).catch(() => {});

    /* The row has to leave the feed it was deleted from; `useListingActions`
       refreshes the profile's own lists, which is not this one. */
    queryClient.invalidateQueries({ queryKey: ["dynamic-list"] });
  }, [config, item, deleteMutation, queryClient]);

  if (!card) return null;

  const isOwner = Boolean(user?.id && item?.ownerId && item.ownerId === user.id);

  const image = resolveMediaUrl(card.images?.[0]);

  const counts = countsLine(Number(item?.likesCount) || 0, commentsCount);

  const authorName = card.seller?.name || "مستخدم";

  const hue = avatarHue(authorName);

  // Not `item.shareUrl`: the backend builds that from its own host.
  const shareUrl = card.href
    ? new URL(card.href, window.location.origin).href
    : window.location.href;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      <header className="flex items-start gap-3 px-4 pt-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full text-[13px] font-bold text-white shadow-xs"
          style={{ backgroundColor: `hsl(${hue} 45% 38%)` }}
        >
          {initialsFrom(authorName)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{authorName}</p>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-muted">
            {card.timeText && <span>{card.timeText}</span>}

            {card.category && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-brand-700">
                  {card.subCategory || card.category}
                </span>
              </>
            )}
          </p>
        </div>

        {isOwner && (
          <OwnerMenu
            editHref={card.href ? `${card.href}/edit` : null}
            onDelete={() => setConfirmingDelete(true)}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </header>

      <div className="px-4 pt-3">
        {card.hasTitle && (
          <h3 className="text-[15px] font-bold leading-7 text-ink">
            {card.href ? (
              <Link to={card.href} className="hover:underline">
                {card.title}
              </Link>
            ) : (
              card.title
            )}
          </h3>
        )}

        {card.description && (
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-[13.5px] leading-7 text-ink-soft">
            {card.description}
          </p>
        )}

        {/* The details action, immediately after the text it continues —
            replacing the separate bar that used to sit at the foot of the
            card. It opens the listing's existing route; no new one exists. */}
        {card.href && card.description && (
          <Link
            to={card.href}
            className="mt-0.5 inline-block text-[13px] font-semibold text-brand-700 hover:underline"
          >
            عرض المزيد
          </Link>
        )}

        {card.location && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
            <MapPin size={13} strokeWidth={2} aria-hidden="true" />
            <span className="truncate">{card.location}</span>
          </p>
        )}
      </div>

      {image && (
        <div className="mt-3">
          {card.href ? (
            <Link to={card.href} aria-label={card.title}>
              <Image src={image} alt={card.hasTitle ? card.title : ""} ratio="aspect-[16/10]" />
            </Link>
          ) : (
            <Image src={image} alt={card.hasTitle ? card.title : ""} ratio="aspect-[16/10]" />
          )}
        </div>
      )}

      {counts && (
        <p className="border-b border-line px-4 pb-2 pt-3 text-[12px] text-muted">
          {counts}
        </p>
      )}

      <div
        className={`flex items-center justify-between gap-1 px-2 py-1.5 ${
          counts ? "" : "border-t border-line"
        }`}
      >
        <LikeButton
          collection={collection}
          postId={item?.id}
          liked={item?.isLikedByCurrentUser ?? false}
          likesCount={Number(item?.likesCount) || 0}
          showLabel
          className="flex-1 justify-center py-2"
        />

        <button
          type="button"
          onClick={openComments}
          aria-haspopup="dialog"
          aria-expanded={isCommentsOpen}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold text-muted transition-colors duration-200 hover:bg-brand-50 hover:text-brand-800"
        >
          <MessageCircle size={17} strokeWidth={2.2} aria-hidden="true" />
          تعليق
          {commentsCount > 0 && (
            <span className="tnum">{formatNumber(commentsCount)}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold text-muted transition-colors duration-200 hover:bg-brand-50 hover:text-brand-800"
        >
          <Share2 size={17} strokeWidth={2.2} aria-hidden="true" />
          مشاركة
        </button>
      </div>

      {hasOpenedComments && (
        <CommentsDrawer
          open={isCommentsOpen}
          onClose={() => setCommentsOpen(false)}
          postId={item?.id}
          collection={collection}
          isPaginated={isPaginated}
          canDeleteComments={canDeleteComments}
          canUpdateComments={canUpdateComments}
          currentUserId={user?.id ?? null}
          onCommentAdded={() => setCommentsCount((count) => count + 1)}
          onCommentDeleted={() =>
            setCommentsCount((count) => Math.max(0, count - 1))
          }
        />
      )}

      <ShareModal
        open={isShareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title={card.hasTitle ? card.title : "منشور على شوبيك لوبيك"}
      />

      <ConfirmDialog
        open={isConfirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
        title="حذف المنشور"
        description="سيُحذف منشورك نهائيًا ولا يمكن التراجع عن ذلك."
        confirmLabel="حذف"
      />
    </article>
  );
}
