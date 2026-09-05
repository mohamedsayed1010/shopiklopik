# Deployment & TWA preparation

How to take this build from a local checkout to a Hostinger VPS, and from there
to a Trusted Web Activity on Google Play.

Anything that needs a value which does not exist yet — the production domain,
the Android package name, the signing fingerprint — is marked and left blank on
purpose. Do not fill those in by guessing; a wrong value in `assetlinks.json`
fails verification silently.

---

## 1. Build

```bash
cp .env.example .env          # adjust VITE_API_BASE_URL if the API has moved
npm ci
npm run build                 # emits dist/
```

`VITE_*` variables are inlined **at build time**, so changing the API host means
rebuilding — not editing a file on the server. Never put a secret in one: they
ship to the browser in readable form.

Leaving `VITE_API_BASE_URL` unset keeps the current backend
(`src/api/axiosInstance.js` holds it as the fallback), so an existing build
pipeline that knows nothing about the variable still produces a working bundle.

---

## 2. Serve it (Hostinger VPS, Nginx)

Upload the contents of `dist/` to the web root, then install the site config:

```bash
sudo cp deploy/nginx/shobiklobik.conf /etc/nginx/sites-available/shobiklobik
sudo ln -s /etc/nginx/sites-available/shobiklobik /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Replace the placeholders in that file first: `YOUR-DOMAIN`, the web root, and —
only if you co-host the API — the Kestrel address.

### The one rule that matters most

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

React Router uses `createBrowserRouter`, so `/dynamic/12/52/<id>`, `/profile`,
`/notifications` and `/admin/...` are client-side paths with no file behind
them. Without this line, opening or refreshing one returns 404 — and that is
exactly the request an Android deep link makes.

The service worker has its own navigation fallback, but it only applies once
installed. The **first** visit reaches Nginx, so both are needed.

### TLS

```bash
sudo certbot --nginx -d YOUR-DOMAIN -d www.YOUR-DOMAIN
```

HTTPS is not optional here. A TWA requires it, service workers require it,
geolocation requires it, and the SignalR hub upgrades to `wss://` only from a
secure page.

---

## 3. Digital Asset Links — **after** the domain and signing key exist

A TWA proves it owns the origin by fetching:

```
https://YOUR-DOMAIN/.well-known/assetlinks.json
```

If that fails, the app still installs but launches with a **browser URL bar
visible** instead of running fullscreen and trusted.

This file is deliberately **not** in the repository, because it cannot be
written without three values that do not exist yet:

| value | where it comes from |
|---|---|
| production domain | the Hostinger deployment |
| Android package name | chosen when you run Bubblewrap (e.g. a reverse-DNS id you control) |
| SHA-256 certificate fingerprint | the **release signing certificate**, not a debug key |

### Getting the fingerprint

If Google Play App Signing is enabled (it is, for new apps), the fingerprint
that must go in this file is the one Play shows under
**Release → Setup → App signing → App signing key certificate** — *not* the
upload key. Using the upload key's fingerprint is the most common reason
verification fails.

From a local keystore instead:

```bash
keytool -list -v -keystore <your-keystore>.jks -alias <your-alias>
```

### The file to create once you have all three

Place it at `public/.well-known/assetlinks.json` so Vite copies it into `dist/`,
or drop it straight into the web root:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "PACKAGE_NAME_HERE",
    "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
  }
}]
```

Then verify, before submitting to Play:

```bash
curl -I https://YOUR-DOMAIN/.well-known/assetlinks.json
```

It must return `200`, `Content-Type: application/json`, and **no redirect**. A
301 from `http://`, or from `www` to apex, breaks verification. The Nginx config
already sets the content type and keeps the SPA fallback from swallowing the
path.

---

## 4. Generating the TWA

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR-DOMAIN/manifest.webmanifest
bubblewrap build
```

Bubblewrap reads the live manifest, so deploy first, then init. It will ask for
the package name and create/point at a signing key — both are the values needed
in step 3.

### Android permissions to declare at this point

Nothing in the web app requests these, so Bubblewrap will not add them for you:

- **`ACCESS_FINE_LOCATION`** — `src/components/CreateAd/LocationPicker.jsx`
  calls `navigator.geolocation.getCurrentPosition`. Without the Android
  permission the browser prompt never appears and the "تحديد موقعي الحالي"
  button silently fails.
- File uploads need **no** permission — `<input type="file">` uses the system
  picker.
- **`POST_NOTIFICATIONS` is not needed.** The app raises no OS notifications;
  see below.

---

## 5. What this app deliberately does not do

**No push notifications.** Notifications are SignalR over a WebSocket, rendered
in-app. There is no Firebase, no FCM, no Push API, and no
`Notification.requestPermission` anywhere in the codebase.

The consequence is worth being explicit about: **a user who closes the TWA will
not be notified of anything.** SignalR only delivers while the page is alive,
and Android does not keep it running in the background. If notifications while
the app is closed are wanted, that is FCM plus a backend sender — a separate
project, not a configuration change.

**Nothing from the API is cached.** The service worker registers no runtime
caching at all, so tokens, `/api/*` responses and the hub are never served from
a cache. This is intentional: it is the usual cause of a TWA showing stale data
or a stale login. Do not add runtime caching for `/api` without thinking it
through.

---

## 6. Checklist

Before deploying:

- [x] Manifest has a stable `id`
- [x] `start_url` and `scope` are `/`
- [x] `display: standalone`
- [x] 192×192 and 512×512 icons present
- [x] Service worker with SPA navigation fallback
- [x] No API/auth/SignalR caching
- [x] API base URL configurable via `VITE_API_BASE_URL`
- [x] Nginx SPA fallback prepared

After deploying to Hostinger:

- [ ] Domain resolves, HTTPS certificate installed
- [ ] Deep link + hard refresh work on real routes
- [ ] `manifest.webmanifest` served as `application/manifest+json`
- [ ] `sw.js` served `no-cache`
- [ ] Chrome DevTools → Application → Manifest reports installable

After Android signing:

- [ ] `assetlinks.json` published and returning 200 with no redirect
- [ ] TWA launches with no URL bar
- [ ] `ACCESS_FINE_LOCATION` declared if the map picker is used
