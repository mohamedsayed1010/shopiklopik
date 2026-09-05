import desktop01 from "../../assets/banners/fallback-banner-desktop-01.webp";
import desktop02 from "../../assets/banners/fallback-banner-desktop-02.webp";
import desktop03 from "../../assets/banners/fallback-banner-desktop-03.webp";
import mobile01 from "../../assets/banners/fallback-banner-mobile-01.webp";
import mobile02 from "../../assets/banners/fallback-banner-mobile-02.webp";
import mobile03 from "../../assets/banners/fallback-banner-mobile-03.webp";

// Promotional artwork for advertising space that is still for sale.
// Three designs, one per placement; each has a desktop and a mobile composition.

const DESIGNS = [
  {
    key: "promo-01",
    slotName: "انشر إعلانك على شوبيك لوبيك خلال دقيقة",
    desktopImageUrl: desktop01,
    mobileImageUrl: mobile01,
  },
  {
    key: "promo-02",
    slotName: "اكتشف المنتجات والخدمات على شوبيك لوبيك",
    desktopImageUrl: desktop02,
    mobileImageUrl: mobile02,
  },
  {
    key: "promo-03",
    slotName: "عروض وفرص مميزة على شوبيك لوبيك",
    desktopImageUrl: desktop03,
    mobileImageUrl: mobile03,
  },
];

export function bannerBookingHref({ placement, categoryId, subCategoryId }) {
  const params = new URLSearchParams();

  if (placement?.location != null) {
    params.set("location", String(placement.location));
  }

  if (categoryId) params.set("categoryId", String(categoryId));

  if (subCategoryId) params.set("subCategoryId", String(subCategoryId));

  return `/banner-booking${params.toString() ? `?${params}` : ""}`;
}

export function fallbackBannerFor({ placement, categoryId, subCategoryId }) {
  const location = Number(placement?.location);

  if (!Number.isFinite(location)) return null;

  const design = DESIGNS[(location - 1) % DESIGNS.length];

  if (!design) return null;

  return {
    id: `${design.key}-${location}`,
    isFallback: true,
    slotName: design.slotName,
    desktopImageUrl: design.desktopImageUrl,
    mobileImageUrl: design.mobileImageUrl,
    targetUrl: bannerBookingHref({ placement, categoryId, subCategoryId }),
    isInternalTarget: true,
  };
}
