import axiosInstance from "../../axiosInstance";

const BASE = "/api/v2/admin/banner-prices";

export async function getBannerPrices() {
  const response = await axiosInstance.get(BASE);

  const rows = response.data?.data;

  // `displayOrder` is what the admin controls; honour it here so every screen
  // shows the same sequence without repeating the sort.
  if (Array.isArray(rows)) {
    response.data.data = [...rows].sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        (a.location ?? 0) - (b.location ?? 0)
    );
  }

  return response.data;
}

export async function getBannerPrice(location) {
  const response = await axiosInstance.get(`${BASE}/${location}`);

  return response.data;
}

export function toPlacementForm(placement) {
  return {
    price: placement?.price ?? 0,
    durationDays: placement?.durationDays ?? "",
    maxSlots: placement?.maxSlots ?? 1,
    desktopWidth: placement?.desktop?.width ?? 0,
    desktopHeight: placement?.desktop?.height ?? 0,
    mobileWidth: placement?.mobile?.width ?? 0,
    mobileHeight: placement?.mobile?.height ?? 0,
    maxImageSizeMegabytes:
      placement?.desktop?.maxSizeMegabytes ??
      placement?.mobile?.maxSizeMegabytes ??
      0,
    allowedFormats: (placement?.desktop?.allowedFormats ?? []).join(", "),
    isActive: placement?.isActive ?? true,
    displayOrder: placement?.displayOrder ?? 0,
  };
}

export function buildPlacementRequest(values) {
  const formats = String(values.allowedFormats ?? "")
    .split(/[,،\s]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return {
    price: Number(values.price) || 0,
    /* Always sent. `UpdateBannerPlacementRequest` declares `durationDays`, and
       a body that omits it binds to 0 on the server — saving an unrelated field
       would silently wipe the placement's booking length. */
    durationDays: Number(values.durationDays) || 0,
    maxSlots: Number(values.maxSlots) || 0,
    desktopWidth: Number(values.desktopWidth) || 0,
    desktopHeight: Number(values.desktopHeight) || 0,
    mobileWidth: Number(values.mobileWidth) || 0,
    mobileHeight: Number(values.mobileHeight) || 0,
    maxImageSizeMegabytes: Number(values.maxImageSizeMegabytes) || 0,
    allowedFormats: [...new Set(formats)],
    isActive: Boolean(values.isActive),
    displayOrder: Number(values.displayOrder) || 0,
  };
}

export async function updateBannerPrice({ location, values }) {
  const response = await axiosInstance.put(
    `${BASE}/${location}`,
    buildPlacementRequest(values)
  );

  return response.data;
}
