
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

function homeBody({ settings, tree }) {
  const name = settings?.siteName || settings?.siteNameEn || "";

  const items = tree
    .map(
      (category) =>
        `<li>${link(`/category/${category.id}`, category.name)}</li>`
    )
    .join("\n        ");

  return body(
    [
      `<h1>${escapeHtml(name)}</h1>`,
      settings?.description ? `<p>${escapeHtml(settings.description)}</p>` : "",
      `<h2>الأقسام</h2>`,
      `<ul>\n        ${items}\n      </ul>`,
    ]
      .filter(Boolean)
      .join("\n      ")
  );
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
    body: homeBody({ settings, tree }) + jsonLd(homeGraph({ settings })),
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
