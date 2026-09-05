import { memo, useCallback, useState } from "react";
import { ThumbsUp } from "lucide-react";

import usePostLike from "../../../hooks/usePostLike";
import { formatNumber } from "../../../utils/format";

function LikeButton({
  collection,
  postId,
  liked = false,
  likesCount = 0,
  showLabel = false,
  className = "",
}) {
  const { isPending, toggle } = usePostLike({
    collection,
    postId,
    liked,
    likesCount,
  });

  const [pressCount, setPressCount] = useState(0);
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback(
    (event) => {
      // The card body is a link — keep the press on the button.
      event.preventDefault();
      event.stopPropagation();

      if (isPending) return;

      const bounds = event.currentTarget.getBoundingClientRect();

      setRipples((current) => [
        ...current,
        {
          id: `${Date.now()}-${current.length}`,
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
      ]);

      setPressCount((count) => count + 1);

      toggle();
    },
    [isPending, toggle]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-busy={isPending || undefined}
      aria-label={liked ? "إلغاء الإعجاب" : "إعجاب"}
      className={`group/like relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-full px-3 py-1.5 text-[13px] font-semibold transition-[background-color,color,transform] duration-300 ease-out hover:bg-brand-50 active:scale-95 disabled:cursor-progress disabled:opacity-70 ${
        liked ? "text-brand-800" : "text-muted hover:text-brand-800"
      } ${className}`}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          onAnimationEnd={() =>
            setRipples((current) =>
              current.filter((item) => item.id !== ripple.id)
            )
          }
          className="pointer-events-none absolute h-10 w-10 animate-ripple rounded-full bg-brand-400/35"
          style={{ left: ripple.x - 20, top: ripple.y - 20 }}
        />
      ))}

      <span className="relative flex items-center">
        {/* Soft halo behind an active thumb. */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 -z-10 rounded-full bg-brand-500/20 blur-md transition-opacity duration-300 ease-out ${
            liked ? "opacity-100" : "opacity-0"
          }`}
        />

        <ThumbsUp
          key={pressCount}
          size={17}
          strokeWidth={2.2}
          aria-hidden="true"
          className={`transition-colors duration-300 ease-out group-hover/like:scale-110 ${
            pressCount > 0 ? "animate-heart-pop" : ""
          } ${liked ? "fill-brand-800 text-brand-800" : "fill-transparent"}`}
        />
      </span>

      {showLabel && <span className="truncate font-bold">إعجاب</span>}

      <span className="tnum">{formatNumber(likesCount)}</span>
    </button>
  );
}

/* A feed renders many cards; a parent re-render must not re-render every
   button. Props are primitives, so the default shallow compare is enough. */
export default memo(LikeButton);
