import axiosInstance from "../axiosInstance";
import { ownerRepublishRequest } from "../../utils/republish";

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

/** The owner's republish, for any listing type. Deliberately sent with no body;
    see `ownerRepublishRequest`. */
export async function republishListing(listing) {
  const request = ownerRepublishRequest(listing);

  if (!request) throw new Error("republishListing: listing has no id or typeId");

  const response = await axiosInstance.post(request.url, undefined, {
    params: request.params,
  });

  return response.data;
}
