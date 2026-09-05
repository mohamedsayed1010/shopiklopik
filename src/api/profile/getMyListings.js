import axiosInstance from "../axiosInstance";

export async function getMyListings({ pageIndex = 1, pageSize = 8 } = {}) {
  const response = await axiosInstance.get("/api/profile/my-listings", {
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
    },
  });

  return response.data;
}

export default getMyListings;
