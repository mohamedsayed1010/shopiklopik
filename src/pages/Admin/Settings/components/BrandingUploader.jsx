import { useEffect, useRef, useState } from "react";
import { AlertCircle, ImageUp, RotateCcw, UploadCloud } from "lucide-react";

import Button from "../../../../components/ui/Button";
import { validateBrandingFile } from "../settingsConstants";

export default function BrandingUploader({
  config,
  currentUrl,
  limits,
  mutation,
  progress,
}) {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState(null);

  const [error, setError] = useState(null);

  const isUploading = mutation.isPending;

  /* Revoking is tied to the URL itself rather than to the picking handler, so
     an unmount mid-selection cannot leak the blob. */
  useEffect(() => {
    if (!previewUrl) return undefined;

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clearSelection = () => {
    setFile(null);

    setPreviewUrl(null);

    setError(null);

    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePick = (event) => {
    const picked = event.target.files?.[0];

    if (!picked) return;

    const message = validateBrandingFile(picked, limits);

    if (message) {
      setError(message);

      setFile(null);

      setPreviewUrl(null);

      // Let the same file be picked again once the admin has read the reason.
      if (inputRef.current) inputRef.current.value = "";

      return;
    }

    setError(null);

    setFile(picked);

    setPreviewUrl(URL.createObjectURL(picked));
  };

  const handleUpload = () => {
    if (!file || isUploading) return;

    mutation.mutate(file, { onSuccess: clearSelection });
  };

  const shown = previewUrl || currentUrl;

  return (
    <div className="rounded-2xl border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface p-2">
          {shown ? (
            <img
              src={shown}
              alt={config.label}
              className={config.previewClass}
              /* A stored URL that 404s should read as "nothing set", not as a
                 broken image icon inside the brand card. */
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <ImageUp
              size={26}
              strokeWidth={1.5}
              aria-hidden="true"
              className="text-brand-300"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{config.label}</p>

          <p className="mt-1 text-[12.5px] leading-6 text-muted">
            {config.description}
          </p>

          {previewUrl && (
            <p className="mt-2 text-[12.5px] font-medium text-brand-700">
              معاينة الملف الجديد — لم يُرفع بعد.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={config.accept}
              onChange={handlePick}
              disabled={isUploading}
              className="hidden"
              id={`branding-${config.key}`}
            />

            <Button
              as="label"
              htmlFor={`branding-${config.key}`}
              variant="outline"
              size="sm"
              disabled={isUploading}
              className={isUploading ? "" : "cursor-pointer"}
            >
              <ImageUp size={15} />
              اختر صورة
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={!file}
              loading={isUploading}
            >
              <UploadCloud size={15} />
              {isUploading && typeof progress === "number"
                ? `جارٍ الرفع ${progress}%`
                : "رفع"}
            </Button>

            {file && !isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                <RotateCcw size={15} />
                إلغاء
              </Button>
            )}
          </div>

          {isUploading && typeof progress === "number" && (
            <div
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`رفع ${config.label}`}
            >
              <div
                className="h-full rounded-full bg-brand-700 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-600"
            >
              <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
