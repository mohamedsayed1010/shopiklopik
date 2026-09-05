import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  MessageCircle,
  Pencil,
  RotateCw,
  Send,
  Trash2,
  X,
} from "lucide-react";

import usePostComments from "../../../hooks/usePostComments";
import Button from "../../ui/Button";
import Spinner from "../../ui/Spinner";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { formatNumber, formatRelativeTime } from "../../../utils/format";
import { apiErrorMessages } from "../../../utils/apiErrors";
import { reportApiError } from "../../../utils/reportApiError";


/** Stable per-name tint, so the same person keeps the same avatar colour. */
const AVATAR_TINTS = [
  "from-brand-500 to-brand-700",
  "from-[#0e7490] to-[#155e75]",
  "from-[#9d3f63] to-[#7a2f4c]",
  "from-[#4338ca] to-[#312ba1]",
  "from-[#a15118] to-[#7c3d12]",
  "from-[#15706b] to-[#0f5551]",
];

function tintFor(name) {
  const text = String(name ?? "");

  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

/** The API returns a display name only — no avatar URL — so it is initialled. */
function CommentAvatar({ name }) {
  const initial = String(name ?? "").trim().charAt(0) || "؟";

  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-xs ${tintFor(
        name
      )}`}
    >
      {initial}
    </span>
  );
}

function CommentRow({
  comment,
  canDelete,
  canEdit,
  isDeleting,
  isUpdating,
  onDelete,
  onUpdate,
}) {
  const [draft, setDraft] = useState(null);

  const isEditing = draft !== null;

  const trimmed = (draft ?? "").trim();

  const submitEdit = async () => {
    /* Nothing to save, and an empty comment is not an edit — the create form
       refuses one too. */
    if (!trimmed || trimmed === comment.comment) {
      setDraft(null);

      return;
    }

    await onUpdate(trimmed);

    setDraft(null);
  };

  return (
    <li className="flex gap-3">
      <CommentAvatar name={comment.userName} />

      <div className="min-w-0 flex-1 rounded-2xl rounded-ss-md border border-line bg-canvas px-3.5 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[13px] font-bold text-ink">
            {comment.userName || "مستخدم"}
          </p>

          <span className="flex shrink-0 items-center gap-1.5">
            <time dateTime={comment.createdAt} className="text-[11px] text-muted">
              {formatRelativeTime(comment.createdAt)}
            </time>

            {/* Offered only where the backend publishes the route *and* the
                payload says this reader may use it. The server enforces the
                rule; this only avoids showing a button that would be refused. */}
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setDraft(comment.comment ?? "")}
                disabled={isUpdating}
                aria-label="تعديل التعليق"
                className="-me-1 cursor-pointer rounded-md p-1 text-muted transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-progress disabled:opacity-60"
              >
                <Pencil size={13} strokeWidth={2} aria-hidden="true" />
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label="حذف التعليق"
                className="-me-1 cursor-pointer rounded-md p-1 text-muted transition-colors duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-progress disabled:opacity-60"
              >
                <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </span>
        </div>

        {isEditing ? (
          <div className="mt-1.5">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              disabled={isUpdating}
              aria-label="نص التعليق"
              className="w-full resize-y rounded-xl border border-line-strong bg-surface px-3 py-2 text-[13.5px] leading-6 text-ink outline-none focus:border-brand-400 disabled:opacity-60"
            />

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={submitEdit}
                disabled={isUpdating || !trimmed}
                className="cursor-pointer rounded-lg bg-brand-900 px-3 py-1.5 text-[12.5px] font-bold text-white transition-colors duration-200 hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                حفظ
              </button>

              <button
                type="button"
                onClick={() => setDraft(null)}
                disabled={isUpdating}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-muted transition-colors duration-200 hover:text-ink disabled:opacity-60"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-[13.5px] leading-6 text-ink-soft">
            {comment.comment}
          </p>
        )}
      </div>
    </li>
  );
}

export default function CommentsDrawer({
  open,
  onClose,
  postId,
  collection,
  isPaginated = false,
  canDeleteComments = false,
  canUpdateComments = false,
  currentUserId = null,
  onCommentAdded,
  onCommentDeleted,
}) {
  const {
    comments,
    totalCount,
    isLoading,
    isError,
    refetch,
    submit,
    isSubmitting,
    remove,
    deletingId,
    update,
    updatingId,
    hasNextPage,
    loadMore,
    isFetchingNextPage,
  } = usePostComments({ collection, postId, isPaginated, enabled: open });

  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const listEndRef = useRef(null);
  const inputRef = useRef(null);

  const handleClose = useCallback(() => {
    setFormError("");
    onClose?.();
  }, [onClose]);

  // Escape to close + scroll lock, mirroring ui/Drawer.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") handleClose();
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, handleClose]);

  // A freshly opened sheet should be ready to type into.
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => inputRef.current?.focus(), 320);

    return () => clearTimeout(timer);
  }, [open]);

  // Newest comment sits at the bottom; keep it in view as the list grows.
  useEffect(() => {
    if (!open) return;

    listEndRef.current?.scrollIntoView({ block: "end" });
  }, [open, comments.length]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const value = draft.trim();

      if (!value) {
        setFormError("اكتب تعليقًا قبل الإرسال.");
        inputRef.current?.focus();
        return;
      }

      setFormError("");

      try {
        await submit(value);

        setDraft("");
        onCommentAdded?.();
      } catch (error) {
        /* The box is one field, so every finding belongs to it — they are
           shown together inline rather than one of them in a toast. */
        setFormError(
          apiErrorMessages(error, "تعذّر نشر التعليق. حاول مرة أخرى.").join(
            " • "
          )
        );
      }
    },
    [draft, submit, onCommentAdded]
  );

  const confirmDelete = useCallback(async () => {
    const target = pendingDelete;

    setPendingDelete(null);

    if (!target) return;

    try {
      await remove(target.id);

      onCommentDeleted?.();
    } catch (error) {
      reportApiError(error, { fallback: "تعذّر حذف التعليق. حاول مرة أخرى." });
    }
  }, [pendingDelete, remove, onCommentDeleted]);

  const ownsComment = (comment) =>
    Boolean(currentUserId) && comment?.userId === currentUserId;

  const isMine = (comment) => comment?.isMine ?? ownsComment(comment);

  const mayEdit = (comment) => comment?.canEdit ?? isMine(comment);

  const mayDelete = (comment) => comment?.canDelete ?? isMine(comment);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="absolute inset-0 bg-brand-950/50 backdrop-blur-[2px]"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="التعليقات"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[86vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-xl sm:max-h-[80vh] sm:max-w-lg sm:rounded-3xl"
          >
            {/* Grab handle reads as "drag me" on phones; noise on desktop. */}
            <span
              aria-hidden="true"
              className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line-strong sm:hidden"
            />

            <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <MessageCircle size={18} className="text-brand-500" />
                التعليقات
                {totalCount > 0 && (
                  <span className="tnum rounded-full bg-brand-50 px-2 py-0.5 text-[12px] font-bold text-brand-700">
                    {formatNumber(totalCount)}
                  </span>
                )}
              </h2>

              <button
                type="button"
                onClick={handleClose}
                aria-label="إغلاق"
                className="-me-2 cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-brand-50 hover:text-ink"
              >
                <X size={20} />
              </button>
            </header>

            <div className="min-h-[8rem] flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-brand-500">
                  <Spinner size="lg" />
                  <p className="text-sm text-muted">جارٍ تحميل التعليقات...</p>
                </div>
              ) : isError ? (
                <div
                  role="alert"
                  className="flex flex-col items-center justify-center gap-3 py-10 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                    <AlertTriangle size={24} className="text-red-600" />
                  </span>

                  <p className="text-sm font-semibold text-ink">
                    تعذّر تحميل التعليقات
                  </p>

                  <p className="max-w-xs text-[13px] leading-6 text-muted">
                    تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.
                  </p>

                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RotateCw size={15} />
                    إعادة المحاولة
                  </Button>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <span className="relative flex h-16 w-16 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 animate-breathe rounded-full bg-brand-100/70 blur-lg"
                    />

                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-50 to-brand-100"
                    />

                    <MessageCircle
                      size={26}
                      strokeWidth={1.6}
                      className="relative text-brand-500"
                    />
                  </span>

                  <p className="text-sm font-semibold text-ink">
                    لا توجد تعليقات بعد
                  </p>

                  <p className="max-w-xs text-[13px] leading-6 text-muted">
                    كن أول من يعلّق على هذا المنشور.
                  </p>
                </div>
              ) : (
                <>
                  <ul className="flex flex-col gap-4">
                    {comments.map((comment, index) => (
                      <CommentRow
                        key={comment.id ?? `${comment.createdAt}-${index}`}
                        comment={comment}
                        canDelete={canDeleteComments && mayDelete(comment)}
                        canEdit={canUpdateComments && mayEdit(comment)}
                        isDeleting={deletingId === comment.id}
                        isUpdating={updatingId === comment.id}
                        onDelete={() => setPendingDelete(comment)}
                        onUpdate={(comment_) =>
                          update({ commentId: comment.id, comment: comment_ })
                        }
                      />
                    ))}
                  </ul>

                  {hasNextPage && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={isFetchingNextPage}
                        onClick={() => loadMore()}
                      >
                        {!isFetchingNextPage && <ChevronDown size={15} />}
                        عرض تعليقات أحدث
                      </Button>
                    </div>
                  )}
                </>
              )}

              <div ref={listEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-line bg-canvas/70 px-5 py-4 backdrop-blur-md safe-bottom"
            >
              <div className="flex items-end gap-2.5">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);

                    if (formError) setFormError("");
                  }}
                  onKeyDown={(event) => {
                    // Enter sends, Shift+Enter breaks the line.
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="اكتب تعليقًا..."
                  aria-label="اكتب تعليقًا"
                  aria-invalid={Boolean(formError) || undefined}
                  disabled={isSubmitting}
                  className={`max-h-32 min-h-11 w-full resize-y rounded-2xl border bg-surface px-4 py-2.5 text-[14px] leading-6 text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted/70 disabled:cursor-not-allowed disabled:bg-canvas ${
                    formError
                      ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/12"
                      : "border-line-strong hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12"
                  }`}
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={!draft.trim()}
                  aria-label="إرسال التعليق"
                  /* Only additive classes: the project has no tailwind-merge,
                     so overriding Button's own padding or radius here would
                     resolve by stylesheet order, not by intent. */
                  className="shrink-0"
                >
                  {!isSubmitting && (
                    // Mirrored so the paper plane points along the text.
                    <Send size={17} className="rtl:-scale-x-100" />
                  )}
                </Button>
              </div>

              {formError && (
                <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                  {formError}
                </p>
              )}
            </form>
          </motion.section>

          <ConfirmDialog
            open={Boolean(pendingDelete)}
            onClose={() => setPendingDelete(null)}
            onConfirm={confirmDelete}
            title="حذف التعليق"
            description="سيُحذف تعليقك نهائيًا ولا يمكن التراجع عن ذلك."
            confirmLabel="حذف"
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
