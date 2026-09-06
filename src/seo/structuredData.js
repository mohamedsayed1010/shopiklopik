/**
 * Builders for the JSON-LD the public pages publish.
 *
 * One rule runs through all of them: every value is something the application
 * already holds — a name from the category tree, a field from the platform
 * settings, an address the router serves. Nothing is defaulted, inferred or
 * filled in to satisfy a schema. A builder that cannot find real values for
 * the fields its type requires returns `null`, and the page renders no graph
 * rather than a decorated guess.
 *
 * What is deliberately absent
 * ---------------------------
 * `Product` and `Offer`. The listings carry a real title and a real price, but
 * a product needs a URL a crawler can actually open, and the ad's own page is
 * behind the sign-in guard. Marking up items whose `url` answers with a login
 * form is not an incomplete description, it is a wrong one. The API also
 * publishes no availability or item condition. When the ad pages become
 * readable without an account, this is the file to add them to.
 *
 * `LocalBusiness`. The settings hold one address and one phone number, but
 * they belong to the marketplace's support desk, not to a storefront with
 * opening hours and a geo location. The type would not describe the thing.
 */

import { canonicalUrl } from "./siteUrl";
import { categoryPath, subCategoryPath } from "./routePolicy";

/** Drop the keys whose value the application did not actually have. */
function present(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
    )
  );
}

function text(value) {
  const string = String(value ?? "").replace(/\s+/g, " ").trim();

  return string || undefined;
}

/** The site itself. No `SearchAction`: the field on the home page navigates
    to a section, and there is no address that takes a query. */
export function websiteSchema({ siteName }) {
  const url = canonicalUrl("/");

  const name = text(siteName);

  if (!url || !name) return null;

  return present({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    inLanguage: "ar-EG",
  });
}

/** The operator, from the platform settings the footer already displays. */
export function organizationSchema({ settings }) {
  const url = canonicalUrl("/");

  const name = text(settings?.siteName || settings?.siteNameEn);

  if (!url || !name) return null;

  const profiles = [
    settings?.facebookUrl,
    settings?.instagramUrl,
    settings?.telegramUrl,
    settings?.twitterUrl,
    settings?.youTubeUrl,
    settings?.tikTokUrl,
    settings?.linkedInUrl,
  ]
    .map(text)
    .filter(Boolean);

  const telephone = text(settings?.phoneNumber);

  const email = text(settings?.email);

  const address = text(settings?.address);

  return present({
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    description: text(settings?.description),
    logo: text(settings?.logoUrl),
    sameAs: profiles,
    address: address
      ? { "@type": "PostalAddress", addressLocality: address }
      : undefined,
    contactPoint:
      telephone || email
        ? present({
            "@type": "ContactPoint",
            contactType: "customer support",
            telephone,
            email,
            availableLanguage: "Arabic",
          })
        : undefined,
  });
}

/**
 * A trail of `{ name, path }`, in order, starting at the home page.
 *
 * Entries without a name are dropped — a breadcrumb whose label is missing
 * would otherwise publish an empty crumb while the tree is still loading.
 */
export function breadcrumbSchema(trail) {
  const items = (trail ?? [])
    .map((crumb) => ({ name: text(crumb?.name), path: crumb?.path }))
    .filter((crumb) => crumb.name && crumb.path);

  if (items.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  };
}

/** An ordered list of addresses a reader can open. */
export function itemListSchema({ name, items }) {
  const rows = (items ?? [])
    .map((item) => ({ name: text(item?.name), path: item?.path }))
    .filter((item) => item.name && item.path);

  if (!rows.length) return null;

  return present({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: text(name),
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: row.name,
      url: canonicalUrl(row.path),
    })),
  });
}

/** A page that is a collection of listings rather than a document. */
export function collectionPageSchema({ name, description, path }) {
  const url = canonicalUrl(path);

  const title = text(name);

  if (!url || !title) return null;

  return present({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: text(description),
    url,
    inLanguage: "ar-EG",
  });
}

/* ---------------------------------------------------------------------------
   Page graphs. Each public catalogue page builds its graph through one of
   these, so a schema is written in exactly one place and no two components can
   publish the same type for the same address.
   ------------------------------------------------------------------------ */

export function homeGraph({ settings }) {
  return [
    websiteSchema({ siteName: settings?.siteName || settings?.siteNameEn }),
    organizationSchema({ settings }),
  ];
}

export function categoryGraph({ category }) {
  if (!category) return [];

  const name = text(category.nameAr || category.name);

  if (!name) return [];

  const path = categoryPath(category.id);

  return [
    breadcrumbSchema([
      { name: "الرئيسية", path: "/" },
      { name, path },
    ]),
    itemListSchema({
      name,
      items: (category.subCategories ?? []).map((sub) => ({
        name: sub.nameAr || sub.name,
        path: subCategoryPath(category.id, sub.id),
      })),
    }),
  ];
}

export function subCategoryGraph({ category, subCategory, description }) {
  if (!category || !subCategory) return [];

  const categoryName = text(category.nameAr || category.name);

  const subCategoryName = text(subCategory.nameAr || subCategory.name);

  if (!categoryName || !subCategoryName) return [];

  const path = subCategoryPath(category.id, subCategory.id);

  return [
    breadcrumbSchema([
      { name: "الرئيسية", path: "/" },
      { name: categoryName, path: categoryPath(category.id) },
      { name: subCategoryName, path },
    ]),
    /* The listings themselves are not described here. Their pages need an
       account to open, so an ItemList of them would point a crawler at a
       sign-in form. */
    collectionPageSchema({ name: subCategoryName, description, path }),
  ];
}
