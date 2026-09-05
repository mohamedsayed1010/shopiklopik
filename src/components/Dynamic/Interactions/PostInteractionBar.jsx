import { memo, useCallback, useState } from "react";
import { MessageCircle } from "lucide-react";

import LikeButton from "./LikeButton";
import CommentsDrawer from "./CommentsDrawer";
import { formatNumber } from "../../../utils/format";

function PostInteractionBar({
  post,
  collection,
  isPaginated = false,
  canDeleteComments = false,
  canUpdateComments = false,
  currentUserId = null,
}) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // Mount the drawer on first open and keep it mounted afterwards. Unmounting
  // it on close would tear down its AnimatePresence before the exit animation
  // could run, and the sheet would vanish instead of sliding away.
  const [hasEverOpened, setHasEverOpened] = useState(false);

  // Seeded from the feed, then owned locally: posting a comment bumps the
  // count without refetching the whole page of results.
  const [commentsCount, setCommentsCount] = useState(
    Number(post?.commentsCount) || 0
  );

  const openDrawer = useCallback(() => {
    setHasEverOpened(true);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleCommentAdded = useCallback(
    () => setCommentsCount((count) => count + 1),
    []
  );

  const handleCommentDeleted = useCallback(
    () => setCommentsCount((count) => Math.max(0, count - 1)),
    []
  );

  return (
    <>
      <div className="relative mt-auto flex items-center justify-between gap-2 border-t border-line bg-gradient-to-b from-white/70 to-canvas/80 px-2.5 py-2 backdrop-blur-md">
        {/* Hairline highlight — the glass edge catching light. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
        />

        <LikeButton
          collection={collection}
          postId={post.id}
          liked={post.isLikedByCurrentUser ?? false}
          likesCount={Number(post.likesCount) || 0}
        />

        <button
          type="button"
          onClick={openDrawer}
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
          aria-label={`التعليقات (${commentsCount})`}
          className="group/comments flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted transition-[background-color,color,transform] duration-300 ease-out hover:bg-brand-50 hover:text-brand-700 active:scale-95"
        >
          <MessageCircle
            size={17}
            strokeWidth={2.2}
            aria-hidden="true"
            className="transition-transform duration-300 ease-out group-hover/comments:-translate-y-0.5 group-hover/comments:scale-110"
          />

          <span className="tnum">{formatNumber(commentsCount)}</span>
        </button>
      </div>

      {hasEverOpened && (
        <CommentsDrawer
          open={isDrawerOpen}
          onClose={closeDrawer}
          postId={post.id}
          collection={collection}
          isPaginated={isPaginated}
          canDeleteComments={canDeleteComments}
          canUpdateComments={canUpdateComments}
          currentUserId={currentUserId}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </>
  );
}

/* Cards re-render together whenever the feed refetches; the bar owns drawer
   state and should not be dragged along unless its post actually changed. */
export default memo(
  PostInteractionBar,
  (previous, next) =>
    previous.post?.id === next.post?.id &&
    previous.collection === next.collection &&
    previous.post?.likesCount === next.post?.likesCount &&
    /* The like flag is compared too: a toggle normally moves the count as
       well, but the button must not miss a state the server reports on its
       own. */
    previous.post?.isLikedByCurrentUser === next.post?.isLikedByCurrentUser &&
    previous.post?.commentsCount === next.post?.commentsCount
);
