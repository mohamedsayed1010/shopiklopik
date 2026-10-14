import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  deleteAdminSubCategory,
  getAdminCategories,
  getAdminSubCategory,
  updateAdminSubCategoryStatus,
} from "../../api/admin/categories/adminCategoriesEndpoints";
import { adminRetry } from "./useAdminAuditLogs";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";

export const ADMIN_CATEGORIES_ROOT = ["admin-categories"];

export const adminCategoriesKey = () => [...ADMIN_CATEGORIES_ROOT, "list"];

export const adminSubCategoryKey = (id) => [
  ...ADMIN_CATEGORIES_ROOT,
  "subcategory",
  String(id ?? ""),
];

/** The public tree every user-facing category list reads. */
const PUBLIC_CATEGORIES_TREE_KEY = ["categories-tree"];

const STATUS_TEXT = {
  401: "انتهت جلستك. سجّل الدخول مرة أخرى ثم أعد المحاولة.",
  429: "طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم أعد المحاولة.",
};

/** Statuses where the server is explaining this record, in its own words. */
const EXPLAINED = new Set([400, 404, 409, 422]);

/* A validation or conflict answer says why this subcategory cannot be read,
   changed or deleted, so its own words are shown. Everything else gets fixed
   text: a 5xx body may carry internals, and the rest always mean one thing. */
export function subCategoryError(error, { fallback, forbidden, notFound }) {
  const status = error?.response?.status;

  if (status === 403) return forbidden;

  if (status === 404) return apiError(error, notFound);

  if (EXPLAINED.has(status)) return apiError(error, fallback);

  return STATUS_TEXT[status] ?? fallback;
}

const NOT_FOUND = "لم يعد هذا القسم الفرعي موجودًا.";

export function useAdminCategories({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminCategoriesKey(),
    queryFn: getAdminCategories,
    enabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    retry: adminRetry,
  });

  return { categoriesQuery: query, categories: query.data?.data ?? [] };
}

export function useAdminSubCategory({ id, enabled = true }) {
  return useQuery({
    queryKey: adminSubCategoryKey(id),
    queryFn: () => getAdminSubCategory(id),
    enabled: id !== null && id !== undefined && enabled,
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 5,
    retry: adminRetry,
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: adminCategoriesKey() });

    // What users are offered may change with it.
    queryClient.invalidateQueries({ queryKey: PUBLIC_CATEGORIES_TREE_KEY });
  }, [queryClient]);
}

export function useDeleteSubCategory({ onDone } = {}) {
  const queryClient = useQueryClient();

  const invalidate = useInvalidateCategories();

  const mutation = useMutation({
    mutationFn: deleteAdminSubCategory,

    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: adminSubCategoryKey(id) });

      toast.success(apiMessage(response, "تم حذف القسم الفرعي"));

      onDone?.(response, id);
    },

    // The row is only ever removed by re-reading the list, so a refusal
    // leaves it exactly where it was.
    onError: (error) =>
      toast.error(
        subCategoryError(error, {
          fallback: "تعذّر حذف القسم الفرعي. حاول مرة أخرى لاحقًا.",
          forbidden: "لا تملك صلاحية حذف الأقسام.",
          notFound: NOT_FOUND,
        })
      ),

    onSettled: invalidate,
  });

  return { mutation, submit: mutation.mutate };
}

/* No optimistic flip: the switch shows the last state the server confirmed,
   and only the PATCH's own answer moves it. */
export function useToggleSubCategoryStatus() {
  const queryClient = useQueryClient();

  const invalidate = useInvalidateCategories();

  const mutation = useMutation({
    mutationFn: updateAdminSubCategoryStatus,

    onSuccess: (response, variables) => {
      const updated = response?.data;

      if (updated && typeof updated.isActive === "boolean") {
        queryClient.setQueryData(adminSubCategoryKey(variables.id), response);

        queryClient.setQueryData(adminCategoriesKey(), (current) => {
          if (!Array.isArray(current?.data)) return current;

          return {
            ...current,
            data: current.data.map((category) => ({
              ...category,
              subCategories: (category.subCategories ?? []).map((sub) =>
                sub.id === updated.id ? { ...sub, isActive: updated.isActive } : sub
              ),
            })),
          };
        });
      }

      const isActive = updated?.isActive ?? variables.isActive;

      toast.success(
        apiMessage(
          response,
          isActive ? "تم تفعيل القسم الفرعي" : "تم تعطيل القسم الفرعي"
        )
      );
    },

    onError: (error) =>
      toast.error(
        subCategoryError(error, {
          fallback: "تعذّر تغيير حالة القسم الفرعي. حاول مرة أخرى لاحقًا.",
          forbidden: "لا تملك صلاحية إدارة الأقسام.",
          notFound: NOT_FOUND,
        })
      ),

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSubCategoryKey(variables.id) });

      invalidate();
    },
  });

  return {
    mutation,
    submit: mutation.mutate,
    pendingId: mutation.isPending ? mutation.variables?.id : null,
  };
}
