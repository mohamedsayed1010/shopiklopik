import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import { ImageUp, Minus, Plus, RotateCcw, ScanSearch } from "lucide-react";

import Modal from "../ui/Modal";
import Button from "../ui/Button";

/** Zoom bounds. 1 is "the image exactly covers the frame". */
const MIN_ZOOM = 1;

const MAX_ZOOM = 4;

const ZOOM_STEP = 0.2;

export default function BannerCropDialog({
  open,
  label,
  spec,
  file,
  busy = false,
  onCancel,
  onReplace,
  onConfirm,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(MIN_ZOOM);

  const [areaPixels, setAreaPixels] = useState(null);

  const [framedFile, setFramedFile] = useState(file);

  if (file !== framedFile) {
    setFramedFile(file);

    setCrop({ x: 0, y: 0 });

    setZoom(MIN_ZOOM);

    setAreaPixels(null);
  }

  /* The picked file is local; the object URL is this dialog's to own and to
     revoke the moment the file changes or the dialog goes away. */
  const imageUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    if (!imageUrl) return undefined;

    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const aspect =
    spec?.width && spec?.height ? Number(spec.width) / Number(spec.height) : 3;

  const onCropComplete = useCallback((_area, croppedAreaPixels) => {
    setAreaPixels(croppedAreaPixels);
  }, []);

  const required =
    spec?.resolution ||
    (spec?.width ? `${spec.width} × ${spec.height} px` : null);

  const stepZoom = (delta) =>
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2))))
    );

  const reset = () => {
    setCrop({ x: 0, y: 0 });

    setZoom(MIN_ZOOM);
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onCancel}
      title={`قص الصورة — ${label}`}
      description={
        required
          ? `اسحب الصورة وكبّرها حتى تظهر داخل الإطار بالشكل الذي تريده. الناتج سيكون ${required} بالضبط.`
          : "اسحب الصورة وكبّرها حتى تظهر داخل الإطار بالشكل الذي تريده."
      }
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={onReplace}
          >
            <ImageUp size={15} />
            تغيير الصورة
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || (zoom === MIN_ZOOM && crop.x === 0 && crop.y === 0)}
            onClick={reset}
          >
            <RotateCcw size={15} />
            إعادة القص
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={busy}
            /* Not a validity check: the frame cannot leave the required ratio,
               so the only thing that can be missing is the first measurement. */
            disabled={busy || !areaPixels}
            onClick={() => areaPixels && onConfirm({ ...areaPixels, zoom })}
          >
            تأكيد القص
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative h-[240px] w-full overflow-hidden rounded-2xl border border-line bg-brand-950 sm:h-[320px]">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              restrictPosition
              showGrid
              zoomWithScroll
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              /* `touch-action: none` is what lets a finger drag the picture
                 instead of scrolling the dialog behind it. */
              style={{
                containerStyle: {
                  backgroundColor: "var(--color-brand-950)",
                  touchAction: "none",
                },
              }}
            />
          )}
        </div>

        {/* Zoom: a slider for fine control, buttons either side because a
            slider thumb is a small target on a phone. */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="تصغير"
            disabled={busy || zoom <= MIN_ZOOM}
            onClick={() => stepZoom(-ZOOM_STEP)}
          >
            <Minus size={15} />
          </Button>

          <label className="flex min-w-0 flex-1 items-center gap-2">
            <ScanSearch
              size={15}
              aria-hidden="true"
              className="shrink-0 text-brand-400"
            />

            <span className="sr-only">مستوى التكبير</span>

            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={busy}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand-600"
            />
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="تكبير"
            disabled={busy || zoom >= MAX_ZOOM}
            onClick={() => stepZoom(ZOOM_STEP)}
          >
            <Plus size={15} />
          </Button>
        </div>

        <p className="text-[11.5px] leading-5 text-muted">
          ما يظهر داخل الإطار هو ما سيُرسل بالضبط. المنطقة المعتمة خارج الإطار
          لن تظهر في الإعلان.
        </p>
      </div>
    </Modal>
  );
}
