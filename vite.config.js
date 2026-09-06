import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      workbox: {
        /* The generated worker answers every navigation request from
           index.html so a deep link resolves in the router. A crawler-facing
           text file requested straight from the address bar is also a
           navigation, so without this list an installed worker would hand back
           the SPA shell for /ads.txt — and keep doing it for returning
           visitors no matter what the server sends.

           Anything here must be a real file in `public/`. */
        navigateFallbackDenylist: [
          /^\/ads\.txt$/,
          /^\/app-ads\.txt$/,
          /^\/robots\.txt$/,
          /^\/sitemap\.xml$/,
          /^\/\.well-known\//,
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