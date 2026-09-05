import { useCallback } from "react";
import { toast } from "react-hot-toast";
import { Heart, Link2, MessageCircle, Share2 } from "lucide-react";

import LikeButton from "../Interactions/LikeButton";
import useFavorite from "../../../hooks/useFavorite";
import { formatNumber } from "../../../utils/format";

/** Desktop browsers have no share sheet — the icon should say so. */
function canShareNatively() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function ActionButton({
  icon: Icon,
  label,
  count,
  active = false,
  activeClass = "",
  disabled = false,
  pending = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active || undefined}
      aria-label={label}
      className={`group/action flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-[13px] font-bold transition-[background-color,color,transform,opacity] duration-300 ease-out hover:bg-brand-50 active:scale-95 disabled:pointer-events-none disabled:opacity-60 ${
        active ? activeClass : "text-muted hover:text-brand-800"
      }`}
    >
      <Icon
        size={17}
        strokeWidth={2.2}
        className={`transition-transform duration-300 ease-out group-hover/action:-translate-y-0.5 group-hover/action:scale-110 ${
          active ? "fill-current" : ""
        } ${pending ? "animate-pulse opacity-60" : ""}`}
      />

      <span className="truncate">{label}</span>

      {Number.isFinite(count) && count > 0 && (
        <span className="tnum text-muted">{formatNumber(count)}</span>
      )}
    </button>
  );
}

export default function AdActionBar({
  adId,
  title,
  likes,
  comments,
  isLiked,
  isFavorite = false,
  favoriteCount = null,
  isLoadingFavorite = false,
  canFavorite = true,
  categoryId = null,
  subCategoryId = null,
  moduleType = null,
  supportsLikes = false,
  supportsComments = false,
  /** The API collection the like route lives under — see `usePostLike`. */
  interactionCollection = null,
  onOpenComments,
}) {
  const {
    isFavorite: isSaved,
    favoriteCount: count,
    toggle,
    isPending,
    canToggle,
  } = useFavorite({
    id: adId,
    type: moduleType,
    categoryId,
    subCategoryId,
    isFavorite,
    favoriteCount,
  });

  const toggleSave = useCallback(async () => {
    const result = await toggle();

    /* Only the server's own answer is announced. A failure has already raised
       its own toast inside the hook and changed nothing here. */
    if (!result) return;

    toast.success(
      result.isFavorite ? "تم الحفظ في المفضلة" : "تمت الإزالة من المفضلة"
    );
  }, [toggle]);

  const share = useCallback(async () => {
    const url = window.location.href;

    // The native sheet is the better experience where it exists (phones);
    // the clipboard is the honest fallback everywhere else.
    if (canShareNatively()) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط الإعلان");
    } catch {
      toast.error("تعذّرت مشاركة الرابط");
    }
  }, [title]);

  return (
    <div className="flex items-center gap-1 rounded-[26px] border border-white/70 glass px-2 py-2 shadow-md ring-1 ring-line/70">
      {supportsLikes ? (
        /* Reads like its neighbours on this rail — icon, word, count — so the
           thumb is not mistaken for the heart two buttons along. */
        <LikeButton
          collection={interactionCollection}
          postId={adId}
          liked={isLiked}
          likesCount={likes}
          showLabel
          className="flex-1 justify-center rounded-2xl py-2.5 text-[13px]"
        />
      ) : null}

      {supportsComments && (
        <ActionButton
          icon={MessageCircle}
          label="تعليق"
          count={comments}
          onClick={onOpenComments}
        />
      )}

      {/* Until the server has reported this ad's favourite state, the button
          says nothing about it: a heart drawn empty during that gap is a claim
          the client cannot yet make. */}
      <ActionButton
        icon={Heart}
        label={
          isLoadingFavorite ? "المفضلة" : isSaved ? "في المفضلة" : "حفظ"
        }
        count={isLoadingFavorite ? null : count}
        active={!isLoadingFavorite && isSaved}
        pending={isLoadingFavorite}
        activeClass="text-red-600"
        disabled={isPending || isLoadingFavorite || !canToggle || !canFavorite}
        onClick={toggleSave}
      />

      <ActionButton icon={canShareNatively() ? Share2 : Link2} label="مشاركة" onClick={share} />
    </div>
  );
}
