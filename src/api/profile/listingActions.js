import axiosInstance from "../axiosInstance";

export async function deleteListing(endpoint) {
  const response = await axiosInstance.delete(endpoint);

  return response.data;
}

export async function updateListing(endpoint, body) {
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await axiosInstance.put(endpoint, body, {
    headers: {
      "Content-Type": isMultipart ? "multipart/form-data" : "application/json",
    },
  });

  return response.data;
}

export async function republishListing(endpoint) {
  const response = await axiosInstance.post(`${endpoint}/republish`);

  return response.data;
}
