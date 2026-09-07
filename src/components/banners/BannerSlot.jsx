import { lazy, Suspense, useContext, useMemo } from "react";

import { AuthContext } from "../../context/AuthContext";
import BannerCard from "./BannerCard";
import {
  BANNER_FRAME,
  BANNER_WIDTH,
  bannerAspectStyle,
  bannerWidthStyle,
} from "./bannerFrame";
import { orderBannersForSession } from "./bannerOrder";
import { fallbackBannerFor } from "./fallbackBanners";
import { Skeleton } from "../ui/Skeleton";

const BannerCarousel = lazy(() => import("./BannerCarousel"));
import { useBannerAvailability } from "../../hooks/useBannerBooking";
import { useBannerSlot } from "../../hooks/useBanners";

/** The placement's own dimensions, held while something is still arriving. */
function SlotSkeleton({ placement }) {
  return (
    <Skeleton
      style={bannerAspectStyle(placement)}
      className={`${BANNER_FRAME} w-full rounded-2xl`}
    />
  );
}

export default function BannerSlot({
  placementKey,
  categoryId,
  subCategoryId,
  showCta = true,
  priority = false,
  className = "",
}) {
  const { banners, placement, isLoading, isError } = useBannerSlot({
    placementKey,
    categoryId,
    subCategoryId,
  });

  const { token } = useContext(AuthContext);

  const availabilityQuery = useBannerAvailability({
    location: placement?.location,
    categoryId,
    subCategoryId,
    enabled: Boolean(token),
  });

  const published = useMemo(() => orderBannersForSession(banners), [banners]);

  const slotStyle = bannerWidthStyle(placement);

  const slotClass = `${BANNER_WIDTH} ${className}`;

  const availability = availabilityQuery.data?.data ?? null;

  const hasFreeSlot = token
    ? availability?.isAvailable === true
    : placement?.isActive !== false;

  const promo =
    showCta && hasFreeSlot
      ? fallbackBannerFor({ placement, categoryId, subCategoryId })
      : null;

  if (isLoading || (banners.length === 0 && availabilityQuery.isLoading)) {
    return (
      <div style={slotStyle} className={slotClass}>
        <SlotSkeleton placement={placement} />
      </div>
    );
  }

  if (isError) return null;

  if (banners.length === 0 && (!placement || placement.isActive === false)) {
    return null;
  }

  if (published.length === 0) {
    if (!promo) return null;

    return (
      <div style={slotStyle} className={slotClass}>
        <BannerCard banner={promo} placement={placement} priority={priority} />
      </div>
    );
  }

  const ctaSlide = promo ? (
    <BannerCard banner={promo} placement={placement} />
  ) : null;

  if (published.length === 1 && !ctaSlide) {
    return (
      <div style={slotStyle} className={slotClass}>
        <BannerCard
          banner={published[0]}
          placement={placement}
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div style={slotStyle} className={slotClass}>
      <Suspense fallback={<SlotSkeleton placement={placement} />}>
        <BannerCarousel
          banners={published}
          placement={placement}
          ctaSlide={ctaSlide}
          priority={priority}
        />
      </Suspense>
    </div>
  );
}
