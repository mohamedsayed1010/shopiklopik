import axiosInstance from "../axiosInstance";

const ADS = "/api/banner-advertisements";

const BOOKINGS = "/api/banner-bookings";

/** Drop empty values: `categoryId=` is a different request from omitting it. */
function toParams(values) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export async function getHomeSlider1Banners() {
  const response = await axiosInstance.get(`${ADS}/home-slider-1`);

  return response.data;
}

export async function getHomeSlider2Banners() {
  const response = await axiosInstance.get(`${ADS}/home-slider-2`);

  return response.data;
}

export async function getSubCategoryBanners({ categoryId, subCategoryId }) {
  const response = await axiosInstance.get(`${ADS}/sub-category`, {
    params: toParams({ categoryId, subCategoryId }),
  });

  return response.data;
}

/** Generic resolver for a placement that has no dedicated endpoint. */
export async function getActiveBanners({ location, categoryId, subCategoryId }) {
  const response = await axiosInstance.get(`${ADS}/active`, {
    params: toParams({ location, categoryId, subCategoryId }),
  });

  return response.data;
}

export async function getBannerPlacements() {
  const response = await axiosInstance.get(`${BOOKINGS}/placements`);

  const rows = response.data?.data;

  if (Array.isArray(rows)) {
    response.data.data = [...rows].sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        (a.location ?? 0) - (b.location ?? 0)
    );
  }

  return response.data;
}
