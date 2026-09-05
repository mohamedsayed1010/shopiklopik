import axiosInstance from "../axiosInstance";

export async function getDynamicData(
  endpoint,
  params = {}
) {
  const response = await axiosInstance.get(endpoint, {
    params,

    paramsSerializer: { indexes: null },
  });

  return response.data;
}
