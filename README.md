# شوبيك لوبيك — Shobik Lobik

An Arabic, right-to-left classifieds marketplace for the Fayoum governorate in
Egypt: users post listings across categories, browse and filter them, save
favourites, book advertising banners and pay for them, while an admin console
moderates the platform.

This repository is the **frontend only** — a React single-page application. The
API is a **separate ASP.NET Core (.NET) backend** that this app talks to over
HTTPS; its source is not in this repository.

| | |
|---|---|
| Frontend | <https://shopiklopik.com> |
| API | <https://api.shopiklopik.com> |
| API reference | <https://api.shopiklopik.com/swagger/index.html> |

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 (`@vitejs/plugin-react`) |
| Routing | React Router 7, `createBrowserRouter` |
| Server state | TanStack Query 5 |
| HTTP | axios, with JWT and refresh-token interceptors |
| Realtime | `@microsoft/signalr` — notifications hub |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`, plus MUI 9 + Emotion |
| Forms | Formik + Yup |
| Animation | Framer Motion |
| Carousels | Swiper, react-multi-carousel |
| Icons | lucide-react, react-icons, `@mui/icons-material` |
| Toasts | react-hot-toast |
| Document head | react-helmet-async |
| PWA | `vite-plugin-pwa` (Workbox `generateSW`) |
| Image cropping | react-easy-crop |
| Excel export | write-excel-file |
| Linting | ESLint 10 (flat config) |

The UI language is Arabic and the document is RTL (`<html lang="ar" dir="rtl">`),
set in `index.html`. The typeface is IBM Plex Sans Arabic, loaded from Google
Fonts.

> `babel-plugin-react-compiler` and `@rolldown/plugin-babel` are present in
> `devDependencies` but are **not** wired into `vite.config.js`, so the React
> Compiler is not currently enabled.

---

## Features

**Marketplace**

- Category and subcategory browsing, with per-category theming
  (`src/theme/categoryTheme.js`)
- Dynamic listing modules: list, details and edit views are driven by
  server-described forms and endpoints rather than hardcoded per category
  (`src/utils/dynamicForm.js`, `src/utils/listingEndpoint.js`)
- Listing creation through a category, subcategory and dynamic-form flow
- Search, filter panels, favourites and recently-viewed history
- Listing reports and user feedback and ratings

**Accounts**

- Register, login, forgot and reset password
- JWT access and refresh tokens held in `localStorage`, refreshed transparently
- Profile management

**Money and promotion**

- Banner booking: advertisers request placements and review their own bookings
- Payments: submit a transfer against a payment method and track its status
- Referral programme: personal code and link, statistics, and who joined

**Notifications**

- Live push over SignalR (`{API_BASE_URL}/hubs/notifications`), authenticated
  with the stored access token
- Per-section notification preferences

**Admin console** (`/admin`, guarded by `AdminRoute`)

- Dashboard, ads moderation, users, reports, feedback, audit logs
- Platform settings, payment methods, banners and banner requests, referrals
- Admin accounts and per-page permissions (super-admin only)

**Presentation**

- Light and dark themes, applied before first paint to avoid a flash: an inline
  script in `index.html` mirrored by `src/utils/theme.js`, both reading the
  `shobik-theme` key
- Installable PWA with an iOS-specific install prompt

Most of the marketplace is behind authentication — the home page itself is
wrapped in `ProtectedRoute`. The routes reachable while signed out are `/login`,
`/register`, `/forgot-password`, `/reset-password`, and the public content pages
`/about`, `/contact`, `/terms` and `/privacy`.

---

## Project structure

```
├── deploy/nginx/          Nginx site config template for the VPS
├── docs/TWA-DEPLOYMENT.md Deployment and Trusted Web Activity guide
├── public/                Static assets, plus generated robots.txt and sitemap.xml
├── scripts/
│   └── generate-seo-files.mjs   Writes robots.txt and sitemap.xml at prebuild
├── src/
│   ├── Routes/            Router table and a registry used for deep links
│   ├── api/               One folder per API area; axios instance and base URL
│   ├── components/        Shared UI, layout, feature components, admin widgets
│   ├── content/           Static legal copy
│   ├── context/           Auth, PWA install, and admin feature contexts
│   ├── hooks/             Data-fetching and UI hooks
│   ├── pages/             Route-level pages, including the Admin console
│   ├── seo/               Canonical URLs, route indexing policy, descriptions
│   ├── theme/             Per-category theming
│   ├── utils/             Formatting, models, permissions, media URLs, theme
│   ├── index.css          Tailwind entry and the design tokens for both themes
│   └── main.jsx           Entry point: service worker, Helmet, App
├── index.html             RTL shell, static SEO and OG tags, pre-paint theme script
└── vite.config.js         Vite, Tailwind and PWA manifest configuration
```

---

## Getting started

**Prerequisites** — Node.js `^20.19.0 || >=22.12.0` (the range Vite 8 declares)
and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server runs on <http://localhost:5173>. Because most routes require a
sign-in, it redirects to `/login` on first load.

---

## Environment variables

Vite only exposes variables prefixed with `VITE_`, and **inlines them at build
time** — changing one means rebuilding, not editing a file on the server. Never
put a secret in them; they ship to the browser in readable form.

Copy `.env.example` to `.env` for local work, or to `.env.production` for a
production build. Both are gitignored; only `.env.example` is committed.

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | No | Base URL of the .NET API. Defaults to `https://api.shopiklopik.com/` (`src/api/apiBaseUrl.js`). Must be `https://` in production, or the browser blocks it as mixed content and takes the SignalR hub down with it. A trailing slash is optional — the app normalises it. |
| `VITE_SITE_URL` | **Yes, for production** | Where this frontend is served from: `https://shopiklopik.com`. Used for canonical URLs, Open Graph URLs and `sitemap.xml`. |

`VITE_SITE_URL` is the one that must not be forgotten. Left unset, canonical
URLs fall back to whatever origin the page happens to be loaded from, and
`sitemap.xml` is **not generated at all** — a sitemap needs absolute URLs, so
the generator skips it rather than emit a wrong one.

A production `.env.production` therefore reads:

```dotenv
VITE_API_BASE_URL=https://api.shopiklopik.com/
VITE_SITE_URL=https://shopiklopik.com
```

Because that file is gitignored, whichever machine or CI runner produces the
production bundle needs its own copy, or the two variables set in its
environment.

---

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server with HMR on port 5173 |
| `npm run lint` | ESLint across the project |
| `npm run build` | Production build to `dist/` (runs `prebuild` first) |
| `npm run preview` | Serve the built `dist/` locally, to check the real bundle |
| `npm run seo:generate` | Regenerate `public/robots.txt` and `public/sitemap.xml` |

`prebuild` runs `seo:generate` automatically, so `npm run build` always emits
fresh SEO files.

---

## API configuration

Every request goes through one axios instance, `src/api/axiosInstance.js`, built
on the single base URL exported by `src/api/apiBaseUrl.js`:

```js
const CONFIGURED =
  import.meta.env.VITE_API_BASE_URL || "https://api.shopiklopik.com/";
```

That module is the only place the API host is written down. The axios instance
adds `Authorization: Bearer <accessToken>` to every request and, on a `401`,
refreshes the token once — queueing any requests that fail while the refresh is
in flight, and signing the user out if it fails. Login, register and
refresh-token calls are excluded from that retry.

`src/utils/mediaUrl.js` derives the media origin from the same base URL, so
uploaded images follow the API host automatically. The SignalR hub URL is
likewise derived, in `src/api/notifications/notificationsHub.js`.

Request and response shapes are documented by the backend Swagger UI at
<https://api.shopiklopik.com/swagger/index.html>.

---

## SEO

- `src/seo/siteUrl.js` builds canonical URLs from `VITE_SITE_URL`, falling back
  to `window.location.origin`.
- `src/seo/routePolicy.js` is the single source of truth for indexing: private
  path prefixes, `noindex` paths, and the sitemap URL list. `robots.txt` and
  `sitemap.xml` are both generated from it — edit the policy, not the files.
- `src/components/Seo.jsx` renders per-page title, description, canonical,
  robots, Open Graph and Twitter tags through react-helmet-async;
  `src/components/SiteHead.jsx` provides the site-wide floor from platform
  settings.
- `index.html` carries static copies of those tags marked `data-rh="true"`, so a
  crawler that runs no JavaScript still sees valid values and Helmet replaces
  them once the app renders. Per-page previews would need pre-rendering, which
  this SPA does not do.
- `scripts/generate-seo-files.mjs` writes `public/robots.txt` and
  `public/sitemap.xml` on every build.

---

## PWA

The manifest lives in `vite.config.js` under `VitePWA`, and the service worker is
generated by Workbox in `generateSW` mode with `registerType: "autoUpdate"`.
`src/main.jsx` registers it immediately on load. Icons are `public/pwa-192.png`
and `public/pwa-512.png` (the 512 is `any maskable`), and the manifest is Arabic
and RTL to match the app.

`src/context/PWAInstallContext.jsx` tracks installability, and
`src/components/IOSInstallModal` covers iOS, which offers no install prompt of
its own.

---

## Production build and deployment

```bash
npm ci
npm run build      # emits dist/
npm run preview    # optional: check the built bundle before uploading
```

`dist/` is a static bundle — upload it to the web root of the server that serves
<https://shopiklopik.com>.

The one server rule that matters is the SPA fallback, because React Router uses
real paths with no files behind them:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Without it, opening or refreshing `/profile` or `/admin/ads` returns 404.

A complete Nginx site config is in `deploy/nginx/shobiklobik.conf` — replace its
`YOUR-DOMAIN` and web-root placeholders before installing it. The full
walkthrough, including TLS and packaging the app as a Trusted Web Activity for
Google Play, is in [`docs/TWA-DEPLOYMENT.md`](docs/TWA-DEPLOYMENT.md).
