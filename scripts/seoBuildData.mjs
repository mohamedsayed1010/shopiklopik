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

import { readFileSync, existsSync } from "node:fs";
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

/** The public platform settings — the same read the running app performs. */
export async function fetchSettings() {
  const api = apiOrigin();

  if (!api) return null;

  const settings = unwrap(await getJson(`${api}/api/v2/settings`));

  return settings && typeof settings === "object" ? settings : null;
}
