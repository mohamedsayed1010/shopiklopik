
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import {
  ROOT,
  siteOrigin,
  fetchCategoryTree,
  fetchSettings,
} from "./seoBuildData.mjs";

import {
  homeGraph,
  categoryGraph,
  subCategoryGraph,
  serializeGraph,
} from "../src/seo/structuredData.js";

const distDir = join(ROOT, "dist");

const shellPath = join(distDir, "index.html");

/* ------------------------------------------------------------------ escaping */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Collapses the whitespace a stored field may carry, for a meta value. */
function oneLine(value, max = 160) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();

  if (text.length <= max) return text;

  const cut = text.slice(0, max);

  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/* ------------------------------------------------------------------- the head */

function withHead(shell, { origin, path, title, description, image }) {
  if (path !== "/") {
    shell = shell.replace(/[ \t]*<link[^>]*data-hero-preload="true"[^>]*>\n?/g, "");
  }

  const url = path === "/" ? `${origin}/` : `${origin}${path}`;

  /* Every tag the shell marks `data-rh` goes, including a canonical this
     script wrote on an earlier run — `/` is both the home page and the
     template, so the step has to be safe to repeat. */
  const stripped = shell
    .replace(/<title[^>]*data-rh="true"[^>]*>[\s\S]*?<\/title>/g, "")
    .replace(/<meta[^>]*data-rh="true"[^>]*>/g, "")
    .replace(/<link[^>]*data-rh="true"[^>]*>/g, "");

  const tags = [
    `<title data-rh="true">${escapeHtml(title)}</title>`,
    `<meta data-rh="true" name="description" content="${escapeHtml(description)}" />`,
    `<meta data-rh="true" name="robots" content="index, follow" />`,
    `<link data-rh="true" rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta data-rh="true" property="og:type" content="website" />`,
    `<meta data-rh="true" property="og:title" content="${escapeHtml(title)}" />`,
    `<meta data-rh="true" property="og:description" content="${escapeHtml(description)}" />`,
    `<meta data-rh="true" property="og:url" content="${escapeHtml(url)}" />`,
    `<meta data-rh="true" property="og:locale" content="ar_EG" />`,
    image
      ? `<meta data-rh="true" property="og:image" content="${escapeHtml(image)}" />`
      : "",
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${escapeHtml(description)}" />`,
    image
      ? `<meta data-rh="true" name="twitter:image" content="${escapeHtml(image)}" />`
      : "",
  ]
    .filter(Boolean)
    .map((tag) => `    ${tag}`)
    .join("\n");

  return stripped.replace("</head>", `${tags}\n  </head>`);
}

/* ------------------------------------------------------------------- the body */

const SHELL_STYLE = [
  "margin:0 auto",
  "max-width:70rem",
  "padding:2rem 1.25rem 4rem",
  "font-family:'IBM Plex Sans Arabic',system-ui,sans-serif",
  "line-height:1.8",
  "color:#12305c",
].join(";");

function link(href, label) {
  return `<a href="${escapeHtml(href)}" style="color:#12305c">${escapeHtml(label)}</a>`;
}

function breadcrumb(trail) {
  const parts = trail.map(({ href, label }) =>
    href ? link(href, label) : escapeHtml(label)
  );

  return `<nav aria-label="مسار التنقل" style="font-size:.9rem;margin-bottom:1rem">${parts.join(
    " ← "
  )}</nav>`;
}

function paragraphs(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block)}</p>`)
    .join("\n      ");
}

function body(inner) {
  return `<div style="${SHELL_STYLE}">\n      ${inner}\n    </div>`;
}

function jsonLd(graph) {
  const json = serializeGraph(graph);

  if (!json) return "";

  return `\n    <script type="application/ld+json">${json}</script>`;
}

/* The home document is also the service worker's navigation fallback, so it is
   what a visitor sees while the bundle downloads. Laid out like the page that
   replaces it — dark bar, dark hero, then the sections — because the plain
   column (name, description, list of links) read as the site footer arriving
   first. Same text and links as before; the colours come from the stylesheet's
   own tokens so the saved theme applies. */
const HERO_LINES = ["كل ما تبحث عنه في الفيوم", "في مكان واحد"];

const HERO_SUBTITLE = "نحن همزة الوصل بين كل منتج والمستهلك";

const HERO_MARKERS = [
  "كل احتياجاتك في مكان واحد",
  "تواصل مباشر مع البائع",
  "بدون عمولة",
];

/** The hero picture sources, read from the preload tags vite-config wrote. */
function heroSources(shell) {
  const tags = shell.match(/<link[^>]*data-hero-preload="true"[^>]*>/g) ?? [];

  const pick = (media) => {
    const tag = tags.find((t) => t.includes(`media="${media}"`));

    return tag?.match(/href="([^"]+)"/)?.[1] ?? null;
  };

  return {
    mobile: pick("(max-width: 1023px)"),
    desktop: pick("(min-width: 1024px)"),
  };
}

function homeTop({ name, hero }) {
  const [lead, ...tail] = String(name || "شوبيك لوبيك").split(" ");

  const picture =
    hero.mobile && hero.desktop
      ? [
          `<picture class="contents">`,
          `<source media="(max-width: 1023px)" type="image/webp" srcset="${escapeHtml(hero.mobile)}" />`,
          `<source type="image/webp" srcset="${escapeHtml(hero.desktop)}" />`,
          `<img data-shell-hero src="${escapeHtml(hero.desktop)}" alt="" aria-hidden="true" loading="eager" decoding="async" fetchpriority="high" class="absolute inset-0 -z-10 h-full w-full object-cover object-[30%_78%] sm:object-[center_85%]" />`,
          `</picture>`,
        ].join("")
      : "";

  const markers = HERO_MARKERS.map(
    (label) =>
      `<li class="flex items-center gap-1.5 sm:gap-2"><span aria-hidden="true" class="shrink-0" style="display:inline-block;width:14px;height:14px"></span>${escapeHtml(label)}</li>`
  ).join("");

  return [
    `<header class="sticky top-0 z-50 border-b border-white/10 bg-brand-900">`,
    `<div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:h-[68px] lg:px-8">`,
    // The logo's plate without the image (that comes from the settings), then the wordmark.
    `<span aria-hidden="true" class="flex shrink-0 items-center gap-2.5"><span class="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/5 ring-1 ring-gold-300/25 shrink-0"></span><span class="flex min-w-0 flex-col"><span class="text-lg sm:text-xl font-bold leading-tight tracking-tight"><span class="text-white">${escapeHtml(lead)}</span><span class="text-gold-300">&nbsp;${escapeHtml(tail.join(" "))}</span></span></span></span>`,
    `</div>`,
    `</header>`,
    `<section aria-hidden="true" class="relative z-20 isolate border-b border-white/5 bg-brand-900">`,
    picture,
    `<div class="absolute inset-0 -z-10 bg-brand-950/22"></div>`,
    `<div class="mx-auto max-w-3xl px-4 py-7 text-center sm:px-6 sm:py-10 lg:py-12">`,
    `<p class="text-[25px] font-bold leading-snug tracking-tight text-white sm:text-4xl">${escapeHtml(HERO_LINES[0])}<span class="block text-gold-300">${escapeHtml(HERO_LINES[1])}</span></p>`,
    `<p class="mx-auto mt-3.5 max-w-xl text-[13px] leading-6 text-brand-200 sm:mt-4 sm:text-base sm:leading-7">${escapeHtml(HERO_SUBTITLE)}</p>`,
    // The search field's outline only — it is not a control until the app runs.
    `<div class="relative mx-auto mt-7 w-[85%] max-w-xl sm:mt-8"><div class="flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-transparent p-1.5 shadow-lg sm:p-2 ring-2 ring-gold-300/60"><span class="h-11 min-w-0 flex-1"></span></div></div>`,
    `<ul class="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 text-[11px] text-brand-200 sm:mt-8 sm:gap-x-6 sm:gap-y-3 sm:text-sm">${markers}</ul>`,
    `</div>`,
    `</section>`,
  ].join("\n    ");
}

const HOME_CARD_STYLE = [
  "display:block",
  "padding:.9rem .75rem",
  "border-radius:1rem",
  "border:1px solid var(--color-line,#e6e9ef)",
  "background:var(--color-surface,#fff)",
  "color:var(--color-ink,#101828)",
  "font-weight:600",
  "text-align:center",
  "text-decoration:none",
].join(";");

function homeBody({ settings, tree, hero }) {
  const name = settings?.siteName || settings?.siteNameEn || "";

  const items = tree
    .map(
      (category) =>
        `<li><a href="${escapeHtml(`/category/${category.id}`)}" style="${HOME_CARD_STYLE}">${escapeHtml(category.name)}</a></li>`
    )
    .join("\n          ");

  return [
    `<div class="flex min-h-screen flex-col bg-canvas" style="font-family:'IBM Plex Sans Arabic',system-ui,sans-serif">`,
    `  ${homeTop({ name, hero })}`,
    `  <div style="max-width:80rem;margin:0 auto;padding:2rem 1rem 4rem;line-height:1.8">`,
    `    <h1 style="margin:0;font-size:1.6rem;line-height:1.4;color:var(--color-ink,#101828)">${escapeHtml(name)}</h1>`,
    settings?.description
      ? `    <p style="margin:.75rem 0 2rem;max-width:36rem;font-size:.875rem;color:var(--color-muted,#667085)">${escapeHtml(settings.description)}</p>`
      : "",
    `    <h2 style="margin:0 0 1rem;font-size:1.25rem;color:var(--color-ink,#101828)">الأقسام</h2>`,
    `    <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(9rem,1fr));gap:.75rem">`,
    `          ${items}`,
    `    </ul>`,
    `  </div>`,
    `</div>`,
  ]
    .filter(Boolean)
    .join("\n    ");
}

function categoryBody({ category }) {
  const items = category.subCategories
    .map(
      (sub) =>
        `<li>${link(`/dynamic/${category.id}/${sub.id}`, sub.name)}</li>`
    )
    .join("\n        ");

  return body(
    [
      breadcrumb([
        { href: "/", label: "الرئيسية" },
        { label: category.name },
      ]),
      `<h1>${escapeHtml(category.name)}</h1>`,
      `<p>حدّد القسم للوصول إلى الإعلانات المتاحة.</p>`,
      items ? `<ul>\n        ${items}\n      </ul>` : "",
    ]
      .filter(Boolean)
      .join("\n      ")
  );
}

function subCategoryBody({ category, sub }) {
  /* The rows are not written here — they change too often to bake in. The
     siblings are, because they are the links onward from this address. */
  const siblings = category.subCategories
    .filter((row) => row.id !== sub.id)
    .map(
      (row) =>
        `<li>${link(`/dynamic/${category.id}/${row.id}`, row.name)}</li>`
    )
    .join("\n        ");

  return body(
    [
      breadcrumb([
        { href: "/", label: "الرئيسية" },
        { href: `/category/${category.id}`, label: category.name },
        { label: sub.name },
      ]),
      `<h1>${escapeHtml(sub.name)}</h1>`,
      `<p>إعلانات ${escapeHtml(sub.name)} داخل ${escapeHtml(
        category.name
      )} على ${escapeHtml("شوبيك لوبيك")}.</p>`,
      siblings
        ? `<h2>أقسام أخرى في ${escapeHtml(
            category.name
          )}</h2>\n      <ul>\n        ${siblings}\n      </ul>`
        : "",
    ]
      .filter(Boolean)
      .join("\n      ")
  );
}

function contentBody({ title, description, text }) {
  return body(
    [
      breadcrumb([{ href: "/", label: "الرئيسية" }, { label: title }]),
      `<h1>${escapeHtml(title)}</h1>`,
      description ? `<p>${escapeHtml(description)}</p>` : "",
      paragraphs(text),
    ]
      .filter(Boolean)
      .join("\n      ")
  );
}

function contactBody({ settings }) {
  const rows = [
    ["الهاتف", settings?.phoneNumber],
    ["واتساب", settings?.whatsAppNumber],
    ["البريد الإلكتروني", settings?.email],
    ["العنوان", settings?.address],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`
    )
    .join("\n        ");

  return body(
    [
      breadcrumb([{ href: "/", label: "الرئيسية" }, { label: "تواصل معنا" }]),
      `<h1>تواصل معنا</h1>`,
      `<p>نسعد بالرد على استفساراتك حول شوبيك لوبيك.</p>`,
      rows ? `<ul>\n        ${rows}\n      </ul>` : "",
    ]
      .filter(Boolean)
      .join("\n      ")
  );
}

/* --------------------------------------------------------------------- output */

const ROOT_REGION = /(<div id="root">)[\s\S]*?(<\/div>\s*<\/body>)/;

function writeRoute(shell, origin, route) {
  const html = withHead(shell, { origin, ...route }).replace(
    ROOT_REGION,
    (_match, open, close) => `${open}${route.body}${close}`
  );

  const dir =
    route.path === "/" ? distDir : join(distDir, ...route.path.split("/").filter(Boolean));

  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, "index.html"), html, "utf8");
}

async function main() {
  if (!existsSync(shellPath)) {
    console.warn("[prerender] dist/index.html is missing — nothing to do.");

    return;
  }

  const origin = siteOrigin();

  if (!origin) {
    console.warn(
      "[prerender] VITE_SITE_URL is not set — skipping. A prerendered page " +
        "needs an absolute canonical."
    );

    return;
  }

  process.env.VITE_SITE_URL = origin;

  const [tree, settings] = await Promise.all([
    fetchCategoryTree(),
    fetchSettings(),
  ]);

  /* Without the catalogue there is nothing to prerender that the shell does
     not already say. The build keeps its plain index.html and stays valid. */
  if (!tree) {
    console.warn(
      "[prerender] category tree unavailable — leaving dist/index.html as the " +
        "only document. The site still works; crawlers just see the shell."
    );

    return;
  }

  const shell = readFileSync(shellPath, "utf8");

  /* If the shell ever stops being "one empty #root and nothing else in the
     body", the anchored replacement below would silently write the shell
     unchanged for all 69 routes. Better to notice and do nothing. */
  if (!ROOT_REGION.test(shell)) {
    console.warn(
      "[prerender] dist/index.html no longer matches the expected " +
        "`<div id=\"root\">…</div></body>` shape — skipping rather than " +
        "writing documents with no content."
    );

    return;
  }

  const siteName = settings?.siteName || settings?.siteNameEn || "شوبيك لوبيك";

  const image = settings?.logoUrl || `${origin}/pwa-512.png`;

  const suffix = (title) => (title.endsWith(siteName) ? title : `${title} | ${siteName}`);

  const routes = [];

  routes.push({
    path: "/",
    title: suffix("سوق الفيوم الإلكتروني"),
    description: oneLine(settings?.description) || siteName,
    image,
    body:
      homeBody({ settings, tree, hero: heroSources(shell) }) +
      jsonLd(homeGraph({ settings })),
  });

  for (const category of tree) {
    routes.push({
      path: `/category/${category.id}`,
      title: suffix(category.name),
      description: oneLine(
        `تصفّح أقسام ${category.name} داخل ${siteName} واختر القسم المناسب للوصول إلى الإعلانات المتاحة.`
      ),
      image,
      body: categoryBody({ category }) + jsonLd(categoryGraph({ category })),
    });

    for (const sub of category.subCategories) {
      routes.push({
        path: `/dynamic/${category.id}/${sub.id}`,
        title: suffix(sub.name),
        description: oneLine(
          `أحدث إعلانات ${sub.name} في قسم ${category.name} على ${siteName}.`
        ),
        image,
        body:
          subCategoryBody({ category, sub }) +
          jsonLd(subCategoryGraph({ category, subCategory: sub })),
      });
    }
  }

  /* The four settings-backed documents. Each is written only when the stored
     field actually has text — a prerendered page that says nothing would be a
     thin page in the index, which is worse than one that renders client-side. */
  const documents = [
    {
      path: "/about",
      title: "من نحن",
      description: "تعرّف على المنصة ورسالتها.",
      field: "aboutUs",
    },
    {
      path: "/terms",
      title: "الشروط والأحكام",
      description:
        "شروط استخدام منصة شوبيك لوبيك: مسؤولية المُعلن، مراجعة الإعلانات، والتزامات كل طرف.",
      field: "termsAndConditions",
    },
    {
      path: "/privacy",
      title: "سياسة الخصوصية",
      description:
        "ما البيانات التي تجمعها منصة شوبيك لوبيك، ولماذا، وما الذي يظهر منها للآخرين.",
      field: "privacyPolicy",
    },
  ];

  for (const doc of documents) {
    const text = settings?.[doc.field];

    if (!String(text ?? "").trim()) {
      console.warn(`[prerender] ${doc.path}: no stored text — left client-rendered.`);

      continue;
    }

    routes.push({
      path: doc.path,
      title: suffix(doc.title),
      description: oneLine(doc.description),
      image,
      body: contentBody({ title: doc.title, description: doc.description, text }),
    });
  }

  if (settings) {
    routes.push({
      path: "/contact",
      title: suffix("تواصل معنا"),
      description: oneLine("نسعد بالرد على استفساراتك حول شوبيك لوبيك."),
      image,
      body: contactBody({ settings }),
    });
  }

  for (const route of routes) writeRoute(shell, origin, route);

  const categories = tree.length;

  const subCategories = tree.reduce(
    (total, row) => total + row.subCategories.length,
    0
  );

  console.log(
    `[prerender] wrote ${routes.length} document(s) — 1 home, ${categories} ` +
      `category, ${subCategories} section, ${routes.length - 1 - categories - subCategories} content`
  );
}

main().catch((error) => {
  // A metadata step must never be the reason a release cannot ship.
  console.warn("[prerender] skipped:", error?.message ?? error);
});
