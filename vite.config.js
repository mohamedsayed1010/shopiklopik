import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

function heroPreload() {
  const WANTED = [
    { name: "bg1.webp", media: "(max-width: 1023px)" },
    { name: "bg.webp", media: "(min-width: 1024px)" },
  ];

  const FONTS = [
    "ibm-plex-sans-arabic-400-arabic.woff2",
    "ibm-plex-sans-arabic-700-arabic.woff2",
  ];

  return {
    name: "hero-preload",
    apply: "build",
    enforce: "post",

    transformIndexHtml: {
      order: "post",

      handler(html, ctx) {
        if (!ctx.bundle) return html;

        const tags = [];

        const findAsset = (name) =>
          Object.values(ctx.bundle).find(
            (asset) =>
              asset.type === "asset" && asset.names?.some((n) => n === name)
          );

        for (const name of FONTS) {
          const file = findAsset(name);

          if (!file) {
            this.warn(`[hero-preload] no bundled font named ${name}.`);

            continue;
          }

          tags.push({
            tag: "link",
            injectTo: "head-prepend",
            attrs: {
              rel: "preload",
              as: "font",
              type: "font/woff2",
              href: `/${file.fileName}`,
              /* Fonts are fetched in CORS mode whatever the origin, so a
                 preload without this is a second, separate request rather than
                 a warm cache hit. */
              crossorigin: "anonymous",
            },
          });
        }

        for (const { name, media } of WANTED) {
          const file = Object.values(ctx.bundle).find(
            (asset) =>
              asset.type === "asset" &&
              asset.names?.some((n) => n === name)
          );

          if (!file) {
            this.warn(
              `[hero-preload] no bundled asset named ${name} — the hero ` +
                `preload for ${media} was not emitted.`
            );

            continue;
          }

          tags.push({
            tag: "link",
            injectTo: "head-prepend",
            attrs: {
              rel: "preload",
              as: "image",
              type: "image/webp",
              href: `/${file.fileName}`,
              media,
              fetchpriority: "high",
              /* Read by scripts/prerender.mjs, which drops these tags from
                 every document that is not the home page — those pages do not
                 render the hero and would download it for nothing. */
              "data-hero-preload": "true",
            },
          });
        }

        return { html, tags };
      },
    },
  };
}

function startAppAfterFirstPaint() {
  const ENTRY = /<script type="module" crossorigin src="([^"]+)"><\/script>/;

  const PRELOAD = /\s*<link rel="modulepreload" crossorigin href="([^"]+)">/g;

  return {
    name: "start-app-after-first-paint",
    apply: "build",
    enforce: "post",

    transformIndexHtml: {
      order: "post",

      handler(html) {
        const entry = html.match(ENTRY);

        if (!entry) {
          this.warn("[start-app-after-first-paint] entry script not found — left as is.");

          return html;
        }

        const preloads = [...html.matchAll(PRELOAD)].map((match) => match[1]);

        const loader = `(function () {
  var started = false;
  function start() {
    if (started) return;
    started = true;
    ${JSON.stringify(preloads)}.forEach(function (href) {
      var link = document.createElement("link");
      link.rel = "modulepreload";
      link.crossOrigin = "anonymous";
      link.href = href;
      document.head.appendChild(link);
    });
    var script = document.createElement("script");
    script.type = "module";
    script.crossOrigin = "anonymous";
    script.src = ${JSON.stringify(entry[1])};
    document.head.appendChild(script);
  }
  var canObserve =
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes &&
    PerformanceObserver.supportedEntryTypes.indexOf("paint") !== -1;
  if (!canObserve) return start();
  new PerformanceObserver(function (list) {
    if (list.getEntriesByName("first-contentful-paint").length) start();
  }).observe({ type: "paint", buffered: true });
  setTimeout(start, 1500);
})();`;

        return html
          .replace(entry[0], "")
          .replace(PRELOAD, "")
          .replace("</head>", `  <script>${loader}</script>\n  </head>`);
      },
    },
  };
}

export default defineConfig({
  build: {
    assetsInlineLimit: (filePath) =>
      filePath.endsWith(".woff2") ? false : undefined,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          // React and the renderer. Everything else depends on these, so they
          // are the chunk with the longest useful cache life.
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "vendor-react";
          }

          // Routing and data. Both are needed before the first screen renders.
          if (
            /[\\/]node_modules[\\/](react-router|react-router-dom|@tanstack)[\\/]/.test(
              id
            )
          ) {
            return "vendor-router";
          }

          // Every icon in one file. This is the group that removes twenty
          // requests: the tree-shaking still applies, so only the icons the
          // build actually references are in it.
          if (/[\\/]node_modules[\\/](lucide-react|react-icons)[\\/]/.test(id)) {
            return "vendor-icons";
          }

          return undefined;
        },
      },
    },
  },

  plugins: [
    react(),
    tailwindcss(),
    heroPreload(),
    startAppAfterFirstPaint(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      workbox: {
        globPatterns: [
          "index.html",
          "manifest.webmanifest",
          "favicon.png",
          "pwa-*.png",
          "assets/*.css",
        ],

        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "assets",
              expiration: { maxEntries: 200, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        /* Stale chunks from previous deployments are removed as soon as this
           worker takes over, rather than sitting in storage indefinitely. */
        cleanupOutdatedCaches: true,

        navigateFallbackDenylist: [
          /^\/ads\.txt$/,
          /^\/app-ads\.txt$/,
          /^\/robots\.txt$/,
          /^\/sitemap\.xml$/,
          /^\/\.well-known\//,

          /* Any address whose last segment has an extension is a file —
             favicon.png, 404.html, a stale asset — never an app route, so it
             goes to the network rather than being answered with the home
             document. No route in src/Routes has a dot in its path, and a dot
             in the query string does not count. */
          /^\/(?:[^/?]+\/)*[^/?]+\.[^/?]+(?:\?.*)?$/,

    
          /^\/(about|contact|terms|privacy)\/?$/,
          /^\/category\/\d+\/?$/,
          /^\/dynamic\/\d+\/\d+\/?$/,
        ],
      },

      manifest: {
        id: "/",
        name: "شوبيك لوبيك - سوق الفيوم",
        short_name: "شوبيك لوبيك",
        description: "سوق إلكتروني يربط بين المشترين والبائعين داخل محافظة الفيوم",
        lang: "ar",
        dir: "rtl",
        theme_color: "#041B3D",
        background_color: "#020A20",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",

        // The source icon.png is 676x369 with transparent padding, so it was
        // being letterboxed as a home-screen icon and as the Android splash.
        // These are square, opaque and padded for the maskable safe zone.
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});