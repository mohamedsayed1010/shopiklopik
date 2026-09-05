
/** Read a file's natural dimensions without putting it in the document. */
export function readImageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(new Error("تعذّر قراءة الصورة"));
    };

    image.src = url;
  });
}

/** Load a file into a decoded `Image`, ready to draw. */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => resolve({ image, revoke: () => URL.revokeObjectURL(url) });

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(new Error("تعذّر قراءة الصورة"));
    };

    image.src = url;
  });
}

/** `["\.jpg",".png"]` -> `["jpg","png"]`, however the server spelled them. */
function normalizedFormats(spec) {
  return (spec?.allowedFormats ?? [])
    .map((entry) => String(entry).trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);
}

function outputType(file, spec) {
  const allowed = normalizedFormats(spec);

  const sourceExt = (file.type.split("/")[1] || "").toLowerCase();

  const asExt = sourceExt === "jpeg" ? "jpg" : sourceExt;

  if (!allowed.length || allowed.includes(asExt) || allowed.includes(sourceExt)) {
    return { mime: file.type || "image/png", ext: asExt || "png" };
  }

  const target = allowed[0];

  return {
    mime: target === "jpg" ? "image/jpeg" : `image/${target}`,
    ext: target,
  };
}

/** Lossy formats can trade quality for bytes; PNG cannot. */
function isLossy(mime) {
  return mime === "image/jpeg" || mime === "image/webp";
}

function coverCrop(source, targetRatio) {
  if (source.width / source.height > targetRatio) {
    const width = source.height * targetRatio;

    return { x: (source.width - width) / 2, y: 0, width, height: source.height };
  }

  const height = source.width / targetRatio;

  return { x: 0, y: (source.height - height) / 2, width: source.width, height };
}

function normalizeCrop(crop, source, targetRatio) {
  if (!crop || !Number.isFinite(crop.width) || crop.width <= 0) {
    return coverCrop(source, targetRatio);
  }

  const bounds = coverCrop(source, targetRatio);

  /* Never wider than the source, and never wider than the biggest correctly
     proportioned box the source can hold. */
  const width = Math.min(crop.width, bounds.width);

  const height = width / targetRatio;

  if (!Number.isFinite(height) || height <= 0 || height > source.height) {
    return bounds;
  }

  const x = Math.min(Math.max(0, crop.x ?? 0), source.width - width);

  const y = Math.min(Math.max(0, crop.y ?? 0), source.height - height);

  return { x, y, width, height };
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), mime, quality)
  );
}

export async function processBannerImage(file, spec, options) {
  const targetWidth = Number(spec?.width);

  const targetHeight = Number(spec?.height);

  if (!Number.isFinite(targetWidth) || !Number.isFinite(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
    throw new Error("مقاس المساحة غير متاح بعد");
  }

  const { image, revoke } = await loadImage(file);

  try {
    const source = { width: image.naturalWidth, height: image.naturalHeight };

    const { mime, ext } = outputType(file, spec);

    const alreadyExact =
      source.width === targetWidth && source.height === targetHeight;

    const canvas = document.createElement("canvas");

    canvas.width = targetWidth;

    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    /* A JPEG has no alpha channel; without a ground colour the transparent
       parts of a PNG source would encode as black. */
    if (mime === "image/jpeg") {
      context.fillStyle = "#ffffff";

      context.fillRect(0, 0, targetWidth, targetHeight);
    }

    context.imageSmoothingEnabled = true;

    context.imageSmoothingQuality = "high";

    const crop = normalizeCrop(options?.crop, source, targetWidth / targetHeight);

    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const maxBytes = Number(spec?.maxSizeBytes) || 0;

    const ladder = isLossy(mime) ? [0.92, 0.85, 0.75, 0.65] : [undefined];

    let blob = null;

    for (const quality of ladder) {
      blob = await canvasToBlob(canvas, mime, quality);

      if (!blob) break;

      if (!maxBytes || blob.size <= maxBytes) break;
    }

    if (!blob) throw new Error("تعذّرت معالجة الصورة");

    if (maxBytes && blob.size > maxBytes) {
      throw new Error(
        `تعذّر ضغط الصورة إلى الحد المسموح (${spec.maxSizeMegabytes} ميجابايت). جرّب صورة أصغر أو بصيغة JPG.`
      );
    }

    const baseName = String(file.name).replace(/\.[^.]+$/, "") || "banner";

    const processed = new File([blob], `${baseName}.${ext}`, { type: mime });

    const visibleRatio = Math.min(
      1,
      (crop.width * crop.height) / (source.width * source.height)
    );

    return {
      file: processed,
      source,
      target: { width: targetWidth, height: targetHeight },
      wasProcessed: !alreadyExact || processed.type !== file.type,
      /* A pixel of the original was left out. Measured against the rectangle
         rather than against the aspect ratios, because an advertiser who zooms
         into a correctly proportioned image has cropped it too. */
      cropped:
        Math.round(crop.width) < source.width ||
        Math.round(crop.height) < source.height,
      crop,
      visibleRatio,
      bytes: processed.size,
    };
  } finally {
    revoke();
  }
}
