import { useContext, useMemo } from "react";

import { AuthContext } from "../../context/AuthContext";
import BannerCard from "./BannerCard";
import {
  BANNER_FRAME,
  BANNER_WIDTH,
  bannerAspectStyle,
  bannerWidthStyle,
} from "./bannerFrame";
import BannerCarousel from "./BannerCarousel";
import { orderBannersForSession } from "./bannerOrder";
import { fallbackBannerFor } from "./fallbackBanners";
import { Skeleton } from "../ui/Skeleton";
import { useBannerAvailability } from "../../hooks/useBannerBooking";
import { useBannerSlot } from "../../hooks/useBanners";

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

  /* `/banner-bookings/availability` is an authenticated endpoint: it answers
     401 without a session. Asking anyway would spend a request to be refused
     on a page that is public, so it is only asked when there is someone to
     ask for. */
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

  /* Signed in, the server says whether the placement still has room. Signed
     out it will not say, so the placement's own `isActive` stands in: a slot
     that is live and carries nothing published is empty, which is exactly what
     the promotional card offers. Keeping the card visible is the point — the
     banner is public, and only the form behind it asks for an account. */
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
        <Skeleton
          style={bannerAspectStyle(placement)}
          className={`${BANNER_FRAME} w-full rounded-2xl`}
        />
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
      <BannerCarousel
        banners={published}
        placement={placement}
        ctaSlide={ctaSlide}
        priority={priority}
      />
    </div>
  );
}
