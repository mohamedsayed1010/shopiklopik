import axiosInstance from "../axiosInstance";

export async function toggleLostFoundLike(postId) {
  const response = await axiosInstance.post(
    `/api/lost-found/${postId}/like`,
    {}
  );

  return response.data;
}

export async function markLostFoundReturned(postId) {
  const response = await axiosInstance.patch(
    `/api/lost-found/${postId}/returned`,
    {}
  );

  return response.data;
}

export async function getLostFoundComments(postId) {
  const response = await axiosInstance.get(
    `/api/lost-found/${postId}/comments`
  );

  return response.data;
}

export async function createLostFoundComment(postId, comment) {
  const response = await axiosInstance.post(
    `/api/lost-found/${postId}/comments`,
    { comment }
  );

  return response.data;
}

