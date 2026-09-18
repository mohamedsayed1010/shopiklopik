/**
 * Share previews for listing addresses.
 *
 * A listing page (`/dynamic/:categoryId/:subCategoryId/:id`) needs an account
 * to open, and it renders in the browser. Facebook, WhatsApp, Telegram,
 * LinkedIn and the rest never run that JavaScript: they read the HTML the
 * address answers with and take the preview from its Open Graph tags. Until
 * now that HTML was the home page's, so every shared listing previewed as the
 * home page.
 *
 * This answers that one address shape with the app's own shell (dist/app.html)
 * plus Open Graph tags for that listing. It does not change who can see the
 * listing: the document is the same bundle, which mounts the same
 * `ProtectedRoute`, so a visitor without a session still lands on the sign-in
 * page exactly as before.
 *
 * Rules this file keeps:
 *
 * - Everyone gets the same bytes. The User-Agent is never read — there is no
 *   crawler allow-list to spoof, because being a crawler grants nothing.
 * - Only what a share preview needs leaves this process: the listing's title
 *   and description (with phone numbers, e-mail addresses and links removed),
 *   its image from the API's own uploads, and the section names. Never the
 *   seller, the phone, the owner id, the price, or any other field.
 * - It reads the listing the way the page does — the details endpoint that
 *   section's read-config names — and only when read-config declares that
 *   endpoint public (`requiresAuthentication: false`). It never sends a token.
 *   If the backend ever makes that endpoint require a session, previews fall
 *   back to the generic site preview; nothing is bypassed.
 * - It fails towards the plain app: an API that is down or slow gives the
 *   generic preview with 200, so a person opening the link is never blocked by
 *   this process. Only a listing the API positively says does not exist is 404.
 *
 * Run: `node server/share-renderer.mjs` (see deploy/nginx/shobiklobik.conf and
 * deploy/share-renderer.service). Environment: SHARE_PORT (default 8787),
 * DIST_DIR (default ./dist), VITE_SITE_URL, VITE_API_BASE_URL.
 */

import http from "node:http";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { ROOT, siteOrigin, apiOrigin } from "../scripts/seoBuildData.mjs";
import { listingDescription, listingTitle } from "../src/seo/descriptions.js";

/** The name a preview shows beside the domain. */
export const SHARE_SITE_NAME = "Shobik Lobik";

/** The Arabic name every page title on the site already ends with. */
const TITLE_SUFFIX = "شوبيك لوبيك";

const GUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

/** The only address shape this answers. Nginx sends nothing else here. */
export const LISTING_PATH = new RegExp(`^/dynamic/(\\d{1,9})/(\\d{1,9})/(${GUID})$`);

/** A details endpoint read-config may name: `/api/<module>/{id}`, nothing else. */
const DETAILS_ENDPOINT = /^\/api\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/\{id\}$/i;

const TIMEOUT_MS = 3500;

const CONFIG_TTL_MS = 10 * 60 * 1000;

const LISTING_TTL_MS = 60 * 1000;

const CACHE_LIMIT = 500;

/* ------------------------------------------------------------------ helpers */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Digits in any of the scripts a seller might type them in, with the
   separators people put between them. Seven or more digits in a run is a phone
   number for this purpose — prices and years are shorter. */
const PHONE = /[+(]?[\d٠-٩۰-۹](?:[\s\-.()]*[\d٠-٩۰-۹]){6,}/g;

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

const LINK = /\b(?:https?:\/\/|www\.)\S+/gi;

/** Text fit for a public preview: no contact details, no links, one line. */
export function scrub(value) {
  if (typeof value !== "string") return "";

  return value
    .replace(LINK, " ")
    .replace(EMAIL, " ")
    .replace(PHONE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The fields a listing's text may live in, as `listingDescription` reads them. */
const TEXT_KEYS = [
  "description",
  "adDescription",
  "postDescription",
  "question",
  "details",
  "productDetails",
  "bio",
  "about",
  "center",
  "city",
  "district",
  "village",
  "governorate",
];

/** The listing reduced to the text a preview may quote, each field scrubbed. */
function previewText(item) {
  const safe = {};

  for (const key of TEXT_KEYS) {
    const text = scrub(item?.[key]);

    if (text) safe[key] = text;
  }

  return safe;
}

/**
 * The listing's own picture, as an absolute URL under the API's /uploads/.
 * Anything else — an external host, a data: URL, nothing at all — is not used,
 * so a preview can never point a crawler at an address the platform does not
 * serve.
 */
export function previewImage(item, api) {
  const gallery = Array.isArray(item?.images) ? item.images : [];

  const first = gallery
    .map((entry) => (typeof entry === "string" ? entry : entry?.url))
    .find((value) => typeof value === "string" && value.trim());

  const candidate = [item?.primaryImageUrl, first, item?.imageUrl].find(
    (value) => typeof value === "string" && value.trim()
  );

  if (!candidate || !api) return null;

  try {
    const base = new URL(`${api}/`);

    const url = new URL(candidate.trim(), base);

    if (!url.pathname.startsWith("/uploads/")) return null;

    // An upload stamped with another host (localhost, an old domain) is still
    // this API's file; it is served from here.
    return `${base.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

function imageType(url) {
  const extension = url.split(".").pop()?.toLowerCase();

  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    }[extension] ?? null
  );
}

/** One anonymous GET. Resolves `{ status, data }`, or `null` on any failure. */
async function getJson(url) {
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      headers: { accept: "application/json" },
    });

    const payload = response.ok ? await response.json() : null;

    return { status: response.status, data: payload?.data ?? payload };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** A small time-limited cache, oldest dropped first. */
function cache(ttl) {
  const rows = new Map();

  return {
    get(key) {
      const row = rows.get(key);

      if (!row || Date.now() - row.at > ttl) return undefined;

      return row.value;
    },

    set(key, value) {
      rows.delete(key);

      rows.set(key, { value, at: Date.now() });

      if (rows.size > CACHE_LIMIT) rows.delete(rows.keys().next().value);
    },
  };
}

/* ---------------------------------------------------------------- templates */

function loader(path) {
  let stamp = 0;

  let text = "";

  return () => {
    const { mtimeMs } = statSync(path);

    // Re-read after a deploy replaces dist/, without a restart.
    if (mtimeMs !== stamp) {
      text = readFileSync(path, "utf8");

      stamp = mtimeMs;
    }

    return text;
  };
}

/* ------------------------------------------------------------------ the core */

/**
 * `{ status, html }` for one listing address, built from `dist/app.html` and
 * `dist/404.html`. Exported so it can be tested without a socket.
 */
export function createRenderer({
  distDir = process.env.DIST_DIR || join(ROOT, "dist"),
  site = siteOrigin(),
  api = apiOrigin(),
  fetchJson = getJson,
} = {}) {
  const appShell = loader(join(distDir, "app.html"));

  const notFoundShell = loader(join(distDir, "404.html"));

  const configs = cache(CONFIG_TTL_MS);

  const listings = cache(LISTING_TTL_MS);

  async function readConfig(categoryId, subCategoryId) {
    const key = `${categoryId}/${subCategoryId}`;

    const hit = configs.get(key);

    if (hit !== undefined) return hit;

    const answer = await fetchJson(
      `${api}/api/lookups/read-config/${categoryId}/${subCategoryId}`
    );

    /* `null` is a section the API says does not exist; `undefined` is a read
       that failed and is not cached, so the next request tries again. */
    if (answer?.status === 404) {
      configs.set(key, null);

      return null;
    }

    if (answer?.status !== 200 || !answer.data || typeof answer.data !== "object") {
      return undefined;
    }

    configs.set(key, answer.data);

    return answer.data;
  }

  /** `{ kind: "listing", meta } | { kind: "missing" } | { kind: "generic" }` */
  async function resolve(categoryId, subCategoryId, id) {
    const key = `${categoryId}/${subCategoryId}/${id.toLowerCase()}`;

    const hit = listings.get(key);

    if (hit) return hit;

    const config = await readConfig(categoryId, subCategoryId);

    if (config === null) return { kind: "missing" };

    if (config === undefined) return { kind: "generic" };

    const endpoint = config.details?.endpoint;

    /* A section read-config does not publish, or whose details it says need
       a session: no preview is attempted. */
    if (
      typeof endpoint !== "string" ||
      !DETAILS_ENDPOINT.test(endpoint) ||
      config.details.requiresAuthentication !== false
    ) {
      return { kind: "generic" };
    }

    const answer = await fetchJson(`${api}${endpoint.replace("{id}", id)}`);

    let result;

    if (answer?.status === 404) {
      result = { kind: "missing" };
    } else if (answer?.status === 200 && answer.data && typeof answer.data === "object") {
      result = { kind: "listing", meta: previewMeta(answer.data, config, categoryId, subCategoryId, id) };
    } else {
      return { kind: "generic" }; // Not cached: an outage should not stick.
    }

    listings.set(key, result);

    return result;
  }

  function previewMeta(item, config, categoryId, subCategoryId, id) {
    const categoryName = config?.category?.nameAr || config?.category?.name || "";

    const subCategoryName = config?.subCategory?.nameAr || config?.subCategory?.name || "";

    const ownTitle = scrub(item.title ?? item.adTitle ?? item.itemName ?? item.name);

    // "<the listing's title> - <section>", or the section alone for a post
    // with no title of its own — the same title the page itself shows.
    const title = listingTitle({ title: ownTitle, subCategoryName }) || "إعلان";

    const description =
      listingDescription({
        item: previewText(item),
        title: ownTitle,
        categoryName,
        subCategoryName,
      }) || `إعلان في ${subCategoryName || categoryName} على ${TITLE_SUFFIX}.`;

    return {
      title,
      description,
      image: previewImage(item, api) || `${site}/pwa-512.png`,
      url: `${site}/dynamic/${categoryId}/${subCategoryId}/${id.toLowerCase()}`,
    };
  }

  function page(shell, meta) {
    const stripped = shell
      .replace(/<title[^>]*data-rh="true"[^>]*>[\s\S]*?<\/title>/g, "")
      .replace(/[ \t]*<meta[^>]*data-rh="true"[^>]*>\n?/g, "")
      .replace(/[ \t]*<link[^>]*data-rh="true"[^>]*>\n?/g, "");

    const type = imageType(meta.image);

    const tags = [
      `<title data-rh="true">${escapeHtml(`${meta.title} | ${TITLE_SUFFIX}`)}</title>`,
      `<meta data-rh="true" name="description" content="${escapeHtml(meta.description)}" />`,
      /* The listing itself is behind the sign-in, so it is not a search
         result. Previews ignore this; search engines do not. */
      `<meta data-rh="true" name="robots" content="noindex, follow" />`,
      `<link data-rh="true" rel="canonical" href="${escapeHtml(meta.url)}" />`,
      `<meta data-rh="true" property="og:type" content="article" />`,
      `<meta data-rh="true" property="og:site_name" content="${escapeHtml(SHARE_SITE_NAME)}" />`,
      `<meta data-rh="true" property="og:locale" content="ar_EG" />`,
      `<meta data-rh="true" property="og:url" content="${escapeHtml(meta.url)}" />`,
      `<meta data-rh="true" property="og:title" content="${escapeHtml(meta.title)}" />`,
      `<meta data-rh="true" property="og:description" content="${escapeHtml(meta.description)}" />`,
      `<meta data-rh="true" property="og:image" content="${escapeHtml(meta.image)}" />`,
      `<meta data-rh="true" property="og:image:secure_url" content="${escapeHtml(meta.image)}" />`,
      type ? `<meta data-rh="true" property="og:image:type" content="${type}" />` : "",
      `<meta data-rh="true" property="og:image:alt" content="${escapeHtml(meta.title)}" />`,
      `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
      `<meta data-rh="true" name="twitter:title" content="${escapeHtml(meta.title)}" />`,
      `<meta data-rh="true" name="twitter:description" content="${escapeHtml(meta.description)}" />`,
      `<meta data-rh="true" name="twitter:image" content="${escapeHtml(meta.image)}" />`,
    ]
      .filter(Boolean)
      .map((tag) => `    ${tag}`)
      .join("\n");

    return stripped.replace("</head>", `${tags}\n  </head>`);
  }

  return async function render(pathname) {
    const match = LISTING_PATH.exec(pathname);

    if (!match) return { status: 404, html: notFoundShell() };

    const [, categoryId, subCategoryId, id] = match;

    const result = await resolve(categoryId, subCategoryId, id);

    if (result.kind === "missing") return { status: 404, html: notFoundShell() };

    if (result.kind === "generic") return { status: 200, html: appShell() };

    return { status: 200, html: page(appShell(), result.meta) };
  };
}

/* ---------------------------------------------------------------- the server */

export function startServer({ port = Number(process.env.SHARE_PORT) || 8787, ...options } = {}) {
  const render = createRenderer(options);

  const server = http.createServer(async (request, response) => {
    const headers = {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { ...headers, allow: "GET, HEAD" });

      response.end();

      return;
    }

    let status = 200;

    let html = "";

    try {
      const pathname = new URL(request.url, "http://localhost").pathname;

      ({ status, html } = await render(pathname));
    } catch (error) {
      console.error("[share] render failed:", error?.message ?? error);

      status = 502; // Nginx answers with the plain app shell instead.
    }

    response.writeHead(status, headers);

    response.end(request.method === "HEAD" ? undefined : html);
  });

  // Loopback only: Nginx is the one client this process has.
  server.listen(port, "127.0.0.1", () => {
    console.log(`[share] listening on 127.0.0.1:${port}`);
  });

  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  if (!siteOrigin() || !apiOrigin()) {
    console.error("[share] VITE_SITE_URL and VITE_API_BASE_URL are required.");

    process.exit(1);
  }

  startServer();
}
