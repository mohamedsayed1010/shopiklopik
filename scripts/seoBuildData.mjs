/**
 * Build-time configuration and catalogue reads, shared by the two SEO scripts.
 *
 * `generate-seo-files.mjs` runs before the bundle is built and writes
 * robots.txt and sitemap.xml; `prerender.mjs` runs after it and writes the
 * per-route HTML. Both need the same origin, the same API base and the same
 * category tree, so the reads live here rather than in each script.
 *
 * Every request below is an anonymous GET against an endpoint the site already
 * serves to logged-out visitors. Nothing here authenticates, and nothing here
 * writes — a build must never be able to change production data.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const ROOT = resolve(here, "..");

/** A `VITE_*` value from the environment, or from a local .env file. */
function readEnv(name) {
  if (process.env[name]) return process.env[name].trim();

  for (const file of [".env.production", ".env.local", ".env"]) {
    const path = join(ROOT, file);

    if (!existsSync(path)) continue;

    const match = readFileSync(path, "utf8").match(
      new RegExp(`^\\s*${name}\\s*=\\s*(.+)$`, "m")
    );

    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }

  return "";
}

/** The production origin, never with a trailing slash. "" when unset. */
export function siteOrigin() {
  return readEnv("VITE_SITE_URL").replace(/\/+$/, "");
}

/** The API origin, never with a trailing slash. "" when unset. */
export function apiOrigin() {
  return readEnv("VITE_API_BASE_URL").replace(/\/+$/, "");
}

/**
 * One anonymous GET, with a deadline.
 *
 * A build machine may be offline, behind a proxy, or building while the API is
 * down. None of those should hang a build or fail it, so this resolves to
 * `null` on any problem and lets the caller decide what to do without it.
 */
async function getJson(url, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      console.warn(`[seo] ${url} answered ${response.status}`);

      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`[seo] ${url} unreachable: ${error?.message ?? error}`);

    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The API's envelope is `{ success, message, data }`; some reads are bare. */
function unwrap(payload) {
  if (!payload) return null;

  return payload.data ?? payload;
}

/**
 * The category tree the app itself navigates by.
 *
 * Returns `[{ id, name, subCategories: [{ id, name }] }]` with the Arabic name
 * preferred, or `null` when the API could not be read. Rows without an id are
 * dropped rather than guessed at.
 */
export async function fetchCategoryTree() {
  const api = apiOrigin();

  if (!api) return null;

  const rows = unwrap(await getJson(`${api}/api/lookups/categories-tree`));

  if (!Array.isArray(rows)) return null;

  const tree = rows
    .filter((row) => row?.id !== undefined && row?.id !== null)
    .map((row) => ({
      id: row.id,
      name: row.nameAr || row.name || "",
      subCategories: (row.subCategories ?? [])
        .filter((sub) => sub?.id !== undefined && sub?.id !== null)
        .map((sub) => ({ id: sub.id, name: sub.nameAr || sub.name || "" })),
    }));

  return tree.length ? tree : null;
}

/* ------------------------------------------------------ empty sections */

/**
 * How many public listings one section holds, read exactly the way its page
 * reads them: the list endpoint and pinned query from that section's
 * read-config, one row per page. `null` when any step could not be read — the
 * caller must treat an unknown count as "not empty", so a failed request can
 * never drop a real section out of the index.
 */
async function countSection(api, categoryId, subCategoryId) {
  const config = unwrap(
    await getJson(`${api}/api/lookups/read-config/${categoryId}/${subCategoryId}`)
  );

  const list = config?.list;

  if (!list?.endpoint || list.requiresAuthentication) return null;

  const params = new URLSearchParams({ pageIndex: "1", pageSize: "1" });

  for (const [key, value] of Object.entries(list.query ?? {})) {
    if (value !== null && value !== undefined) params.set(key, String(value));
  }

  const page = unwrap(await getJson(`${api}${list.endpoint}?${params}`));

  const total = Number(page?.totalCount);

  return Number.isFinite(total) ? total : null;
}

const SECTION_CACHE = join(ROOT, "node_modules", ".cache", "shobiklobik-seo", "sections.json");

/* The sitemap step and the prerender step both need this answer, minutes
   apart. Reading it once and handing the same answer to both is what keeps a
   listing approved mid-build from putting a section in the sitemap while its
   page says noindex. */
const SECTION_CACHE_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * The sections that currently have nothing public to show.
 *
 * Returns `{ emptySubCategories: Set<"c/s">, emptyCategories: Set<id> }`.
 * A category is empty only when every one of its sections is known to be
 * empty. This is recomputed on every build, so a section leaves the set — and
 * returns to the sitemap and the index — as soon as it has a listing and the
 * site is rebuilt. Nothing about any category is hard-coded.
 */
export async function fetchEmptySections(tree) {
  const empty = { emptySubCategories: new Set(), emptyCategories: new Set() };

  const api = apiOrigin();

  if (!api || !tree) return empty;

  let counts = null;

  try {
    const cached = JSON.parse(readFileSync(SECTION_CACHE, "utf8"));

    if (Date.now() - cached.at < SECTION_CACHE_MAX_AGE_MS) counts = cached.counts;
  } catch {
    // No cache, or an unreadable one — read the API.
  }

  if (!counts) {
    counts = {};

    for (const category of tree) {
      for (const sub of category.subCategories) {
        counts[`${category.id}/${sub.id}`] = await countSection(api, category.id, sub.id);
      }
    }

    try {
      mkdirSync(dirname(SECTION_CACHE), { recursive: true });

      writeFileSync(SECTION_CACHE, JSON.stringify({ at: Date.now(), counts }), "utf8");
    } catch {
      // A cache that cannot be written only costs a second read.
    }
  }

  for (const category of tree) {
    const keys = category.subCategories.map((sub) => `${category.id}/${sub.id}`);

    for (const key of keys) if (counts[key] === 0) empty.emptySubCategories.add(key);

    if (keys.length && keys.every((key) => counts[key] === 0)) {
      empty.emptyCategories.add(String(category.id));
    }
  }

  return empty;
}

/** The public platform settings — the same read the running app performs. */
export async function fetchSettings() {
  const api = apiOrigin();

  if (!api) return null;

  const settings = unwrap(await getJson(`${api}/api/v2/settings`));

  return settings && typeof settings === "object" ? settings : null;
}
