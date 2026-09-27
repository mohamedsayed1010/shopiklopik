/**
 * Checks what a deployed site actually answers, the way a crawler reads it:
 * no JavaScript, no service worker, no redirects followed.
 *
 *   npm run seo:check                         the production origin (VITE_SITE_URL)
 *   npm run seo:check -- http://localhost:8080  another server holding the same build
 *
 * The canonical origin is always VITE_SITE_URL, so a local server is judged
 * against the addresses production will publish. Exits 1 on any failure.
 *
 * Why this exists: the routing that makes these answers right lives in the
 * server block (deploy/nginx/shobiklobik.conf), not in this repository's
 * output. It was lost once after being deployed, silently — every page still
 * worked in a browser. A green build proves nothing about it; this does.
 */

import { siteOrigin } from "./seoBuildData.mjs";

const origin = siteOrigin();

const base = (process.argv[2] || origin).replace(/\/+$/, "");

if (!origin) {
  console.error("[seo:check] VITE_SITE_URL is not set.");

  process.exit(1);
}

const failures = [];

let passed = 0;

function check(ok, label, detail = "") {
  if (ok) {
    passed += 1;

    return;
  }

  failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
}

async function get(path) {
  const response = await fetch(`${base}${path}`, {
    redirect: "manual",
    headers: { "user-agent": "shobiklobik-seo-check" },
  });

  const body = response.status === 200 ? await response.text() : "";

  return {
    status: response.status,
    type: response.headers.get("content-type") ?? "",
    location: response.headers.get("location") ?? "",
    body,
  };
}

const attr = (html, pattern) => html.match(pattern)?.[1] ?? null;

function readHead(html) {
  return {
    title: attr(html, /<title[^>]*>([^<]*)<\/title>/),
    description: attr(html, /<meta[^>]*name="description"[^>]*content="([^"]*)"/),
    robots: attr(html, /<meta[^>]*name="robots"[^>]*content="([^"]*)"/),
    canonical: attr(html, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/),
    h1: (html.match(/<h1[\s>]/g) ?? []).length,
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (match) => match[1]
    ),
  };
}

/* ------------------------------------------------------------- the files */

const robots = await get("/robots.txt");

check(robots.status === 200, "/robots.txt answers 200", `got ${robots.status}`);

check(robots.type.startsWith("text/plain"), "/robots.txt is text/plain", robots.type);

check(
  robots.body.includes(`Sitemap: ${origin}/sitemap.xml`),
  "/robots.txt names the sitemap"
);

const sitemap = await get("/sitemap.xml");

check(sitemap.status === 200, "/sitemap.xml answers 200", `got ${sitemap.status}`);

check(/xml/.test(sitemap.type), "/sitemap.xml is XML", sitemap.type);

const manifest = await get("/manifest.webmanifest");

check(manifest.status === 200, "/manifest.webmanifest answers 200", `got ${manifest.status}`);

check(
  manifest.type.startsWith("application/manifest+json"),
  "/manifest.webmanifest is application/manifest+json",
  manifest.type
);

const links = await get("/.well-known/assetlinks.json");

check(links.status === 200, "/.well-known/assetlinks.json answers 200", `got ${links.status}`);

check(
  (() => {
    try {
      return Array.isArray(JSON.parse(links.body));
    } catch {
      return false;
    }
  })(),
  "/.well-known/assetlinks.json is real JSON, not the app shell"
);

/* ---------------------------------------------- every URL in the sitemap */

const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

check(locs.length > 0, "the sitemap lists at least one URL");

const titles = new Map();

for (const loc of locs) {
  check(loc.startsWith(`${origin}/`), `${loc} is on the canonical origin`);

  const path = loc.slice(origin.length) || "/";

  const page = await get(path);

  check(
    page.status === 200,
    `${path} answers 200 without a redirect`,
    page.location ? `${page.status} → ${page.location}` : `got ${page.status}`
  );

  if (page.status !== 200) continue;

  const head = readHead(page.body);

  check(head.canonical === loc, `${path} declares itself canonical`, `canonical=${head.canonical}`);

  check(
    Boolean(head.robots) && !/noindex/.test(head.robots),
    `${path} is indexable`,
    `robots=${head.robots}`
  );

  check(Boolean(head.title), `${path} has a title`);

  check(Boolean(head.description), `${path} has a description`);

  check(head.h1 === 1, `${path} has exactly one h1`, `found ${head.h1}`);

  for (const block of head.jsonLd) {
    try {
      JSON.parse(block);

      passed += 1;
    } catch (error) {
      failures.push(`${path} JSON-LD parses — ${error.message}`);
    }
  }

  if (head.title) {
    check(!titles.has(head.title), `${path} has a unique title`, `same as ${titles.get(head.title)}`);

    titles.set(head.title, path);
  }

  // The slash twin must lead to the canonical, not be a second copy of it.
  if (path !== "/") {
    const twin = await get(`${path}/`);

    check(
      twin.status === 301 && new URL(twin.location, base).pathname === path,
      `${path}/ redirects to ${path}`,
      `got ${twin.status} ${twin.location}`
    );
  }
}

/* ------------------------------------------ what must not look like a page */

const missing = await get("/__seo-check-no-such-page__");

check(missing.status === 404, "an unknown address answers 404", `got ${missing.status}`);

for (const path of ["/login", "/profile", "/admin"]) {
  const page = await get(path);

  const head = readHead(page.body);

  check(page.status === 200, `${path} answers 200 (the app)`, `got ${page.status}`);

  check(
    head.canonical !== `${origin}/`,
    `${path} is not served as the home page`,
    "canonical points at /"
  );

  check(!locs.includes(`${origin}${path}`), `${path} is not in the sitemap`);
}

/* ---------------------------------------------------------------- report */

console.log(`[seo:check] ${base} — ${passed} passed, ${failures.length} failed`);

for (const failure of failures) console.log(`  ✗ ${failure}`);

if (failures.length) process.exitCode = 1;
