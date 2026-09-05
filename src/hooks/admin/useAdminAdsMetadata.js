import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAdminAdsMetadata } from "../../api/admin/ads/adminAdsEndpoints";
import { adminAdsMetadataKey } from "./adminAdsKeys";
import useCategoriesTree from "../../components/CreateAd/useCategoriesTree";

export default function useAdminAdsMetadata({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: adminAdsMetadataKey(),
    queryFn: getAdminAdsMetadata,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: (failureCount, error) => {
      const status = error?.response?.status;

      if (status === 401 || status === 403) return false;

      return failureCount < 2;
    },
  });

  const data = query.data?.data;

  const modules = useMemo(() => data?.modules ?? [], [data]);

  const moderationStatuses = useMemo(
    () => data?.moderationStatuses ?? [],
    [data]
  );

  const rejectionReasons = useMemo(() => data?.rejectionReasons ?? [], [data]);

  const { categories: treeCategories } = useCategoriesTree();

  const modulesCategories = useMemo(() => {
    const index = new Map();

    modules.forEach((module) => {
      const id = Number(module?.categoryId);

      if (!id || index.has(id)) return;

      index.set(id, { id, name: module.categoryName || `#${id}` });
    });

    return [...index.values()];
  }, [modules]);

  const categories = useMemo(() => {
    if (!treeCategories.length) return modulesCategories;

    return treeCategories
      .map((category) => ({
        id: Number(category?.id),
        /* Arabic first, then the English spelling — the same `nameAr ?? name`
           the catalogue is rendered by everywhere else in this app. The tree's
           `name` is English, and this is an Arabic console. */
        name: category?.nameAr || category?.name || `#${category?.id}`,
      }))
      .filter((category) => Boolean(category.id));
  }, [treeCategories, modulesCategories]);

  const subCategoriesOf = useMemo(() => {
    return (categoryId) => {
      const wanted = Number(categoryId) || null;

      if (wanted) {
        const branch = treeCategories.find(
          (category) => Number(category?.id) === wanted
        );

        const fromTree = (branch?.subCategories ?? [])
          .map((sub) => ({
            id: Number(sub?.id),
            name: sub?.nameAr || sub?.name || `#${sub?.id}`,
            categoryId: wanted,
          }))
          .filter((sub) => Boolean(sub.id));

        if (fromTree.length) return fromTree;
      }

      const index = new Map();

      modules.forEach((module) => {
        const id = Number(module?.subCategoryId);

        if (!id || index.has(id)) return;

        if (wanted && Number(module?.categoryId) !== wanted) return;

        index.set(id, {
          id,
          name: module.subCategoryName || `#${id}`,
          categoryId: Number(module?.categoryId) || null,
        });
      });

      return [...index.values()];
    };
  }, [modules, treeCategories]);

  /** Modules of one category, so the type picker narrows with the category. */
  const modulesOf = useMemo(() => {
    return (categoryId, subCategoryId) => {
      const category = Number(categoryId) || null;

      const subCategory = Number(subCategoryId) || null;

      return modules.filter((module) => {
        if (category && Number(module?.categoryId) !== category) return false;

        if (subCategory && Number(module?.subCategoryId) !== subCategory) {
          return false;
        }

        return true;
      });
    };
  }, [modules]);

  return {
    metadataQuery: query,
    modules,
    moderationStatuses,
    rejectionReasons,
    categories,
    subCategoriesOf,
    modulesOf,
  };
}
