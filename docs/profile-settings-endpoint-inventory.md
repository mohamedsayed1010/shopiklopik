# Profile & Settings — Endpoint Inventory

**Date:** 2026-11-08 · **Sources:** production network capture on a dedicated test account (read-only, before this change) and the current frontend code (after). "After" counts come from the code paths and the unit tests in `src/hooks/__tests__/`; they have not been measured against production, because these changes are not deployed.

## Shared on every page (Layout / Navbar / guards)

| Method | Endpoint | Triggered by | Needed? | Response used? | Cached | Invalidated by |
|---|---|---|---|---|---|---|
| GET | `/api/v2/settings` | `useSiteSettings` (footer/contact) | yes | yes | default 30 s | — |
| GET | `/api/notifications/unread-count` | `useUnreadCount` (bell) | yes | yes | 30 s + SignalR push | read/read-all/delete, hub events |
| GET | `/api/v2/admin/me/permissions` | `useAdminAccess` (Navbar, AdminRoute) | only for admins | yes | 5 min; a 403 is cached for the session and remembered per token (local fix) | admin-account mutations |
| GET | `/api/profile` | `useProfileCompletion` (route guard) — **same key as the profile page** | yes | yes | 60 s | profile update, photo, listing delete/republish |
| GET | `/api/advertisements/metadata` | `useListingRoutes`, `useListingModuleType` | yes | yes | 1 h | — |
| POST | `/hubs/notifications/negotiate` (+ socket) | `useNotificationsRealtime` | yes | yes | — | — |
| GET | `/api/rescues`, `/api/blood-requests` | urgent-charity bar (`useUrgentCharityRequests`) | app-wide feature | yes | own settings | — |

## `/profile`

| Method | Endpoint | Triggered by | Needed? | Before (production, cold load) | After |
|---|---|---|---|---|---|
| GET | `/api/profile` | `useProfile` | yes | 1 (shared with guard) | 1 (shared) |
| GET | `/api/profile/my-listings` | `useMyListings` (page of 8) | yes | 1 | 1 |
| GET | `/api/lookups/categories-tree` | `useListingRoutes` (names for the breakdown) | yes | 1 | 1 |
| GET | `/api/lookups/read-config/{c}/{s}` | **`Profile` → `useListingRoutes(byType)` sweep** | **no** — only to place the cars card | up to 19 (one per catalogue pair) | **0** (`fetchConfigs: "none"`) |
| GET | `/api/lookups/read-config/{c}/{s}` | `MyListingsSection` → `useReadConfigs(listings)` | yes — each card's delete/edit endpoints | one per distinct pair on the page (≤ 8), shared/cached 30 min | unchanged |
| GET | `/api/lookups/governorates`, `/centers/{id}` | `EditProfileModal` → `useCenters` | only when the modal is open | lazy | lazy (unchanged) |
| POST | `/api/profile/image` | `AvatarUploader` | on upload | — | — |
| PUT | `/api/profile` | `EditProfileModal` | on save | — | — |
| POST | `/api/profile/change-password` | `ChangePasswordModal` | on save | — | — |

**The 19 `read-config` requests, diagnosed:** exactly one module type, `Advertisement` (cars), is published by the metadata without a category pair (`0:0`). To link that single breakdown card, `useListingRoutes` swept `read-config` for every visible pair (19), and even then linked to the first car sub-category only, although the account's car ads span four. The other 14 types are placed by the one metadata request. The per-page `read-config` calls from `useReadConfigs` are genuine and unchanged. The sweep also previously fired *before* the metadata answered (fixed in Phase 1).

## Settings & account pages (load only)

| Page | Endpoints | Needed? | Notes |
|---|---|---|---|
| `/profile/edit` | `GET /api/profile`, `GET governorates`, `GET centers/{id}` | yes | profile shared with the guard |
| `/notifications/settings` | `GET preferences`, `GET interests/options`, `GET interests` | yes | mutations invalidate their own keys (+ preferences from interests) |
| `/favorites` | `GET /api/advertisements/favorites` | yes | invalidated by favourite toggles |
| `/payments` | `GET /api/payments/my` **×2 in production** → ×1 | yes | `""` vs omitted status produced two keys (fixed: `normalizePaymentStatus`) |
| `/payments/new` | `GET /api/payments/methods` | yes | 5 min cache |
| `/referrals` | `GET me`, `GET me/statistics`, `GET me/users` | yes | no focus refetch |
| `/my-banner-bookings` | `GET /api/banner-bookings/my` | yes | |
| `/banner-booking` | `GET placements`, `GET payment-methods` | yes | |
| `/delete-account` | none until submitted | — | |

## Query keys, caching and isolation

- **Isolation between sessions:** `AuthContext.login` and `logout` call `queryClient.clear()`; forced sign-outs reload the page. No user-scoped cache survives an account change, so user ids in keys are not required. The admin denial marker is keyed by `sub:jti` (Phase A fix).
- **Shared keys:** `["profile"]` serves the guard, the profile page and the edit page; `["my-payments","list",status|"all"]` now has one entry per real filter.
- **Invalidation after mutations:** profile update and photo upload invalidate `["profile"]` only and now also update the session's user (`patchUser`); before, the navbar kept the old name and e-mail until a reload. Listing edits also re-read the owner-only moderation status (Phase 2).
- **Global defaults** (`staleTime 30 s`, `gcTime 30 min`) were left unchanged: no evidence they are wrong.
