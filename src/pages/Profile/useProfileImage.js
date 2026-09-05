import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { uploadProfileImage } from "../../api/profile/uploadProfileImage";
import {
  PROFILE_QUERY_KEY,
  apiError,
  apiMessage,
  mergeProfileCache,
  mergeStoredUser,
} from "./profileCache";

/** Guardrails that match what an image endpoint will accept anyway. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** Rejected in the browser so the user hears about it instantly, not after an upload. */
export function validateImageFile(file) {
  if (!file) return "اختر صورة أولاً";

  if (!file.type?.startsWith("image/")) return "الملف المختار ليس صورة";

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "الصيغ المدعومة: JPG أو PNG أو WEBP أو GIF";
  }

  if (file.size > MAX_IMAGE_BYTES) return "حجم الصورة يجب ألا يتجاوز 5 ميجابايت";

  return null;
}

export default function useProfileImage({ onUploaded } = {}) {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadProfileImage,

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم تحديث صورتك الشخصية"));

      mergeProfileCache(queryClient, response?.data);
      mergeStoredUser(response?.data);

      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

      onUploaded?.(response?.data ?? null);
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر رفع الصورة، حاول مرة أخرى"));
    },
  });

  return { uploadMutation };
}
