import { createBrowserRouter } from "react-router-dom";
import { registerAppRoutes } from "./routeRegistry";

import Layout from "../components/Layout/Layout";
import ProtectedRoute from './../components/ProtectedRoute/ProtectedRoute';
import AdminRoute from "../components/AdminRoute/AdminRoute";
import ProfileCompletionGuard from "../components/ProfileCompletionGuard/ProfileCompletionGuard";
import Home from "../pages/Home/index";

/* Fetched on arrival instead of with the app — see `./lazyRoutes` for which
   pages those are and why each one qualifies. */
import {
  SubCategories,
  DynamicListPage,
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  AboutPage,
  ContactPage,
  TermsPage,
  PrivacyPage,
  DeleteAccountPage,
  NotFound,
  Profile,
  EditProfilePage,
  FavoritesPage,
  NotificationSettingsPage,
  ReferralsPage,
  DynamicDetailsPage,
  EditListingPage,
  CreateAd,
  CategoryDetails,
  DynamicAdForm,
  MyPaymentsPage,
  NewPaymentPage,
  PaymentDetailsPage,
  BannerBookingPage,
  MyBannerBookingsPage,
  BannerBookingDetailsPage,
  AdminDashboardPage,
  AdminAdsPage,
  AdminUsersPage,
  AdminAccountsPage,
  AdminAccountCreatePage,
  AdminAccountPermissionsPage,
  AdminReportsPage,
  AdminFeedbackPage,
  AdminAuditLogsPage,
  AdminSettingsPage,
  AdminPaymentMethodsPage,
  AdminBannersPage,
  AdminReferralsPage,
  AdminReferralDetailsPage,
} from "./lazyRoutes";

const routes = [
  /* Every address in the app is a child of this one, which is what makes the
     completion guard total: an account still missing required data is turned
     back before the page under it renders — whether it arrived by link, by
     typed address, by history or in a second tab. `ProtectedRoute` and
     `AdminRoute` below still apply on top of it. */
  {path: "", element: <ProfileCompletionGuard><Layout/></ProfileCompletionGuard>, children: [
    {index: true, element: <Home/>},
    {path:"create-product", element: <ProtectedRoute> <CreateAd/> </ProtectedRoute>},
    {path:"create-product/:categoryId", element: <ProtectedRoute> <CategoryDetails/> </ProtectedRoute>},
    {path:"create-product/:categoryId/:subCategoryId", element: <ProtectedRoute> <DynamicAdForm/> </ProtectedRoute>},
    {path:"category/:categoryId", element: <SubCategories/>},
    { path:"dynamic/:categoryId/:subCategoryId", element: <DynamicListPage/>},

    /* The wall. A card is public; the ad behind it is not. `ProtectedRoute`
       carries the address being asked for, so signing in lands back here. */
    {path: "dynamic/:categoryId/:subCategoryId/:id",element: <ProtectedRoute>  <DynamicDetailsPage/> </ProtectedRoute>},

    // Editing lives under the ad's own address rather than under
    // /create-product, so the route carries the id the module is addressed by.
    {path: "dynamic/:categoryId/:subCategoryId/:id/edit", element: <ProtectedRoute> <EditListingPage/> </ProtectedRoute>},
    {path: "favorites", element: <ProtectedRoute> <FavoritesPage/> </ProtectedRoute>},

    // The referral programme: the reader's own code, link, statistics and the
    // people who joined through them. Every /api/referrals/me endpoint is
    // authenticated, so the page is too.
    {path: "referrals", element: <ProtectedRoute> <ReferralsPage/> </ProtectedRoute>},

    // Booking a banner placement. Opened from an empty slot's call to action
    // with ?location=&categoryId=&subCategoryId= already filled in.
    {path: "banner-booking", element: <ProtectedRoute> <BannerBookingPage/> </ProtectedRoute>},

    // The advertiser's own bookings, and one of them in full. The second is
    // also the address the backend's booking notifications deep-link to
    // (/banner-bookings/{id}), which until now resolved to the not-found page.
    {path: "my-banner-bookings", element: <ProtectedRoute> <MyBannerBookingsPage/> </ProtectedRoute>},
    {path: "banner-bookings/:id", element: <ProtectedRoute> <BannerBookingDetailsPage/> </ProtectedRoute>},

    // The payer's own payments: the list, the submission form and one
    // payment. Signed-in only — every /api/payments endpoint is authenticated
    // and scoped to the caller.
    {path: "payments", element: <ProtectedRoute> <MyPaymentsPage/> </ProtectedRoute>},
    {path: "payments/new", element: <ProtectedRoute> <NewPaymentPage/> </ProtectedRoute>},
    {path: "payments/:id", element: <ProtectedRoute> <PaymentDetailsPage/> </ProtectedRoute>},

    // The notification preference and the followed sections. Reached from the
    // notifications drawer and from the main menu.
    {path: "notifications/settings", element: <ProtectedRoute> <NotificationSettingsPage/> </ProtectedRoute>},

    {path: "admin", element: <AdminRoute> <AdminDashboardPage/> </AdminRoute>},

    {path: "admin/ads", element: <AdminRoute> <AdminAdsPage/> </AdminRoute>},

    {path: "admin/ads/:type/:id", element: <AdminRoute> <AdminAdsPage/> </AdminRoute>},

    // Accounts: browse, inspect and change status.
    {path: "admin/users", element: <AdminRoute> <AdminUsersPage/> </AdminRoute>},

    // One account, addressed directly. The account notifications deep-link to
    // /admin/users/{id}; the list reads that account from GET /users/{id} and
    // opens its details sheet.
    {path: "admin/users/:id", element: <AdminRoute> <AdminUsersPage/> </AdminRoute>},

    {path: "admin/accounts", element: <AdminRoute superAdminOnly> <AdminAccountsPage/> </AdminRoute>},

    {path: "admin/accounts/create", element: <AdminRoute superAdminOnly> <AdminAccountCreatePage/> </AdminRoute>},

    {path: "admin/accounts/:id", element: <AdminRoute superAdminOnly> <AdminAccountsPage/> </AdminRoute>},

    // Editing an account's grants is a page for the same reason creating one
    // is: fifteen pages of checkboxes do not belong in a dialog's nested
    // scroller. Same guard as every other address here.
    {path: "admin/accounts/:id/permissions", element: <AdminRoute superAdminOnly> <AdminAccountPermissionsPage/> </AdminRoute>},

    // The referral centre: platform statistics, the leaderboard, every
    // referral, and one referral's own address. Read-only — the contract
    // publishes no admin write for referrals.
    {path: "admin/referrals", element: <AdminRoute> <AdminReferralsPage/> </AdminRoute>},
    {path: "admin/referrals/:id", element: <AdminRoute> <AdminReferralDetailsPage/> </AdminRoute>},

    // Listing reports raised by users.
    {path: "admin/reports", element: <AdminRoute> <AdminReportsPage/> </AdminRoute>},

    // One report, addressed directly. The "بلاغ جديد" notification deep-links
    // to /admin/reports/{reportId}, which had no route and therefore opened the
    // not-found page. Same page, same guard — it opens that report's drawer.
    {path: "admin/reports/:id", element: <AdminRoute> <AdminReportsPage/> </AdminRoute>},

    // The administrative audit trail. Read-only, same guard.
    // User ratings. A separate feature from the reports above — different
    // endpoints, different records, its own `feedback` page in the catalogue.
    {path: "admin/feedback", element: <AdminRoute> <AdminFeedbackPage/> </AdminRoute>},

    {path: "admin/audit-logs", element: <AdminRoute> <AdminAuditLogsPage/> </AdminRoute>},

    // Platform settings: the site's own record, and the source the footer and
    // the content pages below read from.
    {path: "admin/settings", element: <AdminRoute> <AdminSettingsPage/> </AdminRoute>},

    // The methods users may transfer to. Same admin guard as every other
    // /admin route.
    {path: "admin/payment-methods", element: <AdminRoute> <AdminPaymentMethodsPage/> </AdminRoute>},

    // Banner centre: advertiser requests, house banners and placement pricing.
    {path: "admin/banners", element: <AdminRoute> <AdminBannersPage/> </AdminRoute>},

    // The dashboard quick action the API returns points at
    // /admin/banner-requests?status=PendingReview, so that address resolves to
    // the same centre rather than to the not-found page.
    {path: "admin/banner-requests", element: <AdminRoute> <AdminBannersPage/> </AdminRoute>},

    // One booking, addressed directly. The "طلب حجز بانر جديد" notification
    // deep-links to /admin/banner-requests/{id}; the centre reads that booking
    // from GET /banner-requests/{id} and opens its details dialog.
    {path: "admin/banner-requests/:id", element: <AdminRoute> <AdminBannersPage/> </AdminRoute>},

    // The public destinations for the settings' long-form fields. Each one
    // renders a single stored field, so none of them carries copy of its own.
    {path: "about", element: <AboutPage/>},
    {path: "contact", element: <ContactPage/>},
    {path: "terms", element: <TermsPage/>},
    {path: "privacy", element: <PrivacyPage/>},

    // The account-deletion page Google Play links to. Deliberately NOT behind
    // `ProtectedRoute`: anyone may read how deletion works. The deletion itself
    // is signed-in only — the page renders its form only with a session.
    {path: "delete-account", element: <DeleteAccountPage/>},

    {path: "/register", element: <Register/>},
    {path: "/login", element: <Login/>},
    {path: "/forgot-password", element: <ForgotPassword/>},
    {path: "/reset-password", element: <ResetPassword/>},
    {path: "/profile", element: <ProtectedRoute><Profile/></ProtectedRoute>},

    /* The profile form, addressable. It is where `ProfileCompletionGuard`
       sends an account that still owes required data, and the one page that
       guard lets through — signed in, like everything else under /profile. */
    {path: "/profile/edit", element: <ProtectedRoute><EditProfilePage/></ProtectedRoute>},

    // Anything unmatched lands here rather than on a blank page under a
    // working navbar. Kept last so it never shadows a real route.
    {path: "*", element: <NotFound/>},

  ]}
];

/* Registered before any component renders, so a notification arriving on the
   first paint is already checked against the real table. */
registerAppRoutes(routes);

export const router = createBrowserRouter(routes);