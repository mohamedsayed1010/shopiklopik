import axiosInstance from "../axiosInstance";

export function collectionOfComments(endpoint) {
  if (typeof endpoint !== "string") return null;

  const match = /^\/api\/([^/]+)\/\{id\}\/comments\/?$/.exec(endpoint.trim());

  return match ? match[1] : null;
}

const DELETES_COMMENTS = new Set(["ask-consults", "lost-found"]);

const UPDATES_COMMENTS = new Set(["ask-consults", "lost-found"]);

export function interactionCapabilities(commentsOperation) {
  const collection = collectionOfComments(commentsOperation?.endpoint);

  return {
    collection,
    isPaginated: commentsOperation?.paginated === true,
    canDeleteComments: collection ? DELETES_COMMENTS.has(collection) : false,
    canUpdateComments: collection ? UPDATES_COMMENTS.has(collection) : false,
  };
}

export async function togglePostLike(collection, postId) {
  const response = await axiosInstance.post(
    `/api/${collection}/${postId}/like`,
    {}
  );

  return response.data;
}

export async function getPostComments(collection, postId, params) {
  const response = await axiosInstance.get(
    `/api/${collection}/${postId}/comments`,
    params ? { params } : undefined
  );

  return response.data;
}

export async function createPostComment(collection, postId, comment) {
  const response = await axiosInstance.post(
    `/api/${collection}/${postId}/comments`,
    { comment }
  );

  return response.data;
}

export async function updatePostComment(collection, postId, commentId, comment) {
  const response = await axiosInstance.put(
    `/api/${collection}/${postId}/comments/${commentId}`,
    { comment }
  );

  return response.data;
}

export async function deletePostComment(collection, postId, commentId) {
  const response = await axiosInstance.delete(
    `/api/${collection}/${postId}/comments/${commentId}`
  );

  return response.data;
}
