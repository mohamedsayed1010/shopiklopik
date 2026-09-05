import { useMemo } from "react";

import HomeListingSection from "./HomeListingSection";
import useCategoriesTree from "../../CreateAd/useCategoriesTree";
import { HOME_SECTIONS, resolveSection } from "./homeSections";
import ListingRail from "../../ui/ListingRail";

export default function HomeListingSections() {
  const { categories, isLoading, isError } = useCategoriesTree();

  const sections = useMemo(
    () =>
      HOME_SECTIONS.map((section) => ({
        ...section,
        ids: resolveSection(categories, section),
      })).filter((section) => section.ids),
    [categories]
  );

  if (isLoading) {
    return (
      <>
        {HOME_SECTIONS.map((section) => (
          <ListingRail
            key={section.key}
            title={section.title}
            subtitle={section.subtitle}
            isLoading
            skeletonCount={4}
          />
        ))}
      </>
    );
  }

  /* The tree is shared infrastructure; if it cannot be read the categories
     section above has already reported it, so these rows stay silent rather
     than repeating the same error seven times. */
  if (isError || sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <HomeListingSection
          key={section.key}
          title={section.title}
          subtitle={section.subtitle}
          categoryId={section.ids.categoryId}
          subCategoryId={section.ids.subCategoryId}
        />
      ))}
    </>
  );
}
