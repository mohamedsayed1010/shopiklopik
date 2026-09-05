import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import ProfileAvatar from "./ProfileAvatar";
import useProfileImage, { validateImageFile } from "../useProfileImage";

export default function AvatarUploader({ profile, currentSrc, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef(null);

  const dragDepth = useRef(0);

  const { uploadMutation } = useProfileImage({
    onUploaded: (user) => {
      onUploaded?.(user);
      onClose?.();
    },
  });

  // An object URL is a resource, not a string — release it when it is replaced
  // or the sheet closes.
  useEffect(() => {
    if (!preview) return undefined;

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const accept = useCallback((candidate) => {
    const problem = validateImageFile(candidate);

    if (problem) {
      toast.error(problem);

      return;
    }

    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  }, []);

  const clear = () => {
    setFile(null);
    setPreview(null);

    if (inputRef.current) inputRef.current.value = "";
  };

  /* Drag events fire on children too — counting enter/leave keeps the
     highlight from flickering as the pointer crosses the inner text. */
  const onDragEnter = (event) => {
    event.preventDefault();

    dragDepth.current += 1;

    setIsDragging(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();

    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) setIsDragging(false);
  };

  const onDrop = (event) => {
    event.preventDefault();

    dragDepth.current = 0;

    setIsDragging(false);

    const dropped = event.dataTransfer?.files?.[0];

    if (dropped) accept(dropped);
  };

  const isPending = uploadMutation.isPending;

  const fullName = [profile?.firstName, profile?.secondName]
    .filter(Boolean)
    .join(" ");

  return (
    <Modal
      open
      onClose={isPending ? undefined : onClose}
      title="الصورة الشخصية"
      description="اسحب صورة وأفلتها، أو اخترها من جهازك."
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isPending}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            fullWidth
            loading={isPending}
            disabled={!file}
            onClick={() => file && uploadMutation.mutate(file)}
          >
            {isPending ? (
              "جارٍ الرفع..."
            ) : (
              <>
                <Check size={16} />
                حفظ الصورة
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <ProfileAvatar
            src={preview ?? currentSrc}
            name={fullName}
            size={128}
            className="ring-4 ring-brand-50"
          />

          {isPending && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-brand-950/45">
              <span
                aria-hidden="true"
                className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/40 border-t-white"
              />
            </span>
          )}
        </div>

        <div
          onDragEnter={onDragEnter}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition-colors duration-200 ${
            isDragging
              ? "border-brand-400 bg-brand-50"
              : "border-line-strong bg-canvas"
          }`}
        >
          <UploadCloud
            size={30}
            strokeWidth={1.6}
            aria-hidden="true"
            className={`mx-auto transition-colors duration-200 ${
              isDragging ? "text-brand-600" : "text-brand-300"
            }`}
          />

          <p className="mt-3 text-sm font-medium text-ink">
            {isDragging ? "أفلت الصورة هنا" : "اسحب الصورة إلى هنا"}
          </p>

          <p className="mt-1 text-xs text-muted">
            JPG أو PNG أو WEBP — حتى 5 ميجابايت
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus size={15} className="text-brand-500" />
              اختر صورة
            </Button>

            {file && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={clear}
              >
                <Trash2 size={15} />
                إزالة الاختيار
              </Button>
            )}
          </div>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => {
              const chosen = event.currentTarget.files?.[0];

              if (chosen) accept(chosen);
            }}
          />

          {file && (
            <p className="mt-4 truncate text-xs font-medium text-brand-700" dir="ltr">
              {file.name}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
