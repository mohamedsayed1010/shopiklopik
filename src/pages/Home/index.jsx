import Seo from "../../components/Seo";

import Hero from "../../components/Home/Hero/Hero";
import BannerSlot from "../../components/banners/BannerSlot";
import CategoriesSection from "../../components/Home/CategoriesSlider/index";
import RecentlyViewed from "../../components/Home/RecentlyViewed/RecentlyViewed";
import HomeListingSections from "../../components/Home/ListingSections/index";
import { PLACEMENT_KEYS } from "../../utils/bannerPlacements";

export default function Home() {
  return (
    <>
      {/* The one page whose title is the site-s own positioning rather than a
          section name. The description is left to `SiteHead`, which reads the
          administrator-s own wording from the settings. */}
      <Seo title="سوق الفيوم الإلكتروني" />

      <Hero />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="space-y-4">
          <BannerSlot placementKey={PLACEMENT_KEYS.homeSlider1} priority />
        </div>


        {/* Marketplace content resumes, at the page's normal section rhythm. */}
        <div className="mt-12 space-y-12">
          {/* Removes itself on a first visit — see the component. */}
          <RecentlyViewed />

          
          <BannerSlot placementKey={PLACEMENT_KEYS.homeSlider2} />

          <CategoriesSection />

          {/* The marketplace rows, after the categories and in the order
              `HOME_SECTIONS` lists them. Everything above is untouched. */}
          <HomeListingSections />
        </div>
      </div>
    </>
  );
}
