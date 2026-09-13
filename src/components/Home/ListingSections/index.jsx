import { useMemo } from "react";

import HomeListingSection from "./HomeListingSection";
import useCategoriesTree from "../../CreateAd/useCategoriesTree";
import useNearViewport from "../../../hooks/useNearViewport";
import { HOME_SECTIONS, resolveSection } from "./homeSections";
import ListingRail from "../../ui/ListingRail";

/* Roughly the height of a loading rail. It holds the page's length while a
   rail is still out of reach, and is skipped by the browser while off screen. */
const RESERVE_CLASS =
  "min-h-[27rem] [content-visibility:auto] [contain-intrinsic-size:auto_27rem]";

function HomeRail({ section, ids }) {
  const [ref, isNear] = useNearViewport();

  if (!isNear) {
    return <div ref={ref} aria-hidden="true" className={RESERVE_CLASS} />;
  }

  if (!ids) {
    return (
      <ListingRail
        title={section.title}
        subtitle={section.subtitle}
        isLoading
        skeletonCount={4}
      />
    );
  }

  return (
    <HomeListingSection
      title={section.title}
      subtitle={section.subtitle}
      categoryId={ids.categoryId}
      subCategoryId={ids.subCategoryId}
    />
  );
}

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
          <HomeRail key={section.key} section={section} ids={null} />
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
        <HomeRail key={section.key} section={section} ids={section.ids} />
      ))}
    </>
  );
}
