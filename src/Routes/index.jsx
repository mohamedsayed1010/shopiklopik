import { createBrowserRouter } from "react-router-dom";
import { registerAppRoutes } from "./routeRegistry";
import Register from "../components/Register/Register";
import Layout from "../components/Layout/Layout";
import Login from "../components/Login/Login";
import ProtectedRoute from './../components/ProtectedRoute/ProtectedRoute';
import AdminRoute from "../components/AdminRoute/AdminRoute";
import Home from "../pages/Home/index";
import ForgotPassword from "../components/ForgetPassword/ForgotPassword";
import ResetPassword from "../components/ResetPassword/ResetPassword";
import Profile from "../pages/Profile/Profile";
import CreateAd from "../components/CreateAd/CreateAd";
import CategoryDetails from "../components/CreateAd/CategoryDetails";
import DynamicAdForm from "../components/CreateAd/DynamicAdForm";
import SubCategories from "../components/Home/CategoriesSlider/SubCategories/SubCategories";
import DynamicListPage from "../pages/DynamicList";
import DynamicDetailsPage from "../pages/DynamicDetails";
import EditListingPage from "../pages/EditListing";
import FavoritesPage from "../pages/Favorites";
import NotificationSettingsPage from "../pages/NotificationSettings";
import AdminDashboardPage from "../pages/Admin/Dashboard";
import AdminAdsPage from "../pages/Admin/Ads";
import AdminUsersPage from "../pages/Admin/Users";
import AdminAccountsPage from "../pages/Admin/Accounts";
import AdminAccountCreatePage from "../pages/Admin/Accounts/Create";
import AdminAccountPermissionsPage from "../pages/Admin/Accounts/Permissions";
import AdminReportsPage from "../pages/Admin/Reports";
import AdminFeedbackPage from "../pages/Admin/Feedback";
import AdminAuditLogsPage from "../pages/Admin/AuditLogs";
import AdminSettingsPage from "../pages/Admin/Settings";
import AdminPaymentMethodsPage from "../pages/Admin/PaymentMethods";
import AdminBannersPage from "../pages/Admin/Banners";
import MyPaymentsPage from "../pages/Payments";
import NewPaymentPage from "../pages/Payments/NewPayment";
import PaymentDetailsPage from "../pages/Payments/PaymentDetails";
import AboutPage from "../pages/About";
import ContactPage from "../pages/Contact";
import TermsPage from "../pages/Terms";
import PrivacyPage from "../pages/Privacy";
import BannerBookingPage from "../pages/BannerBooking";
import MyBannerBookingsPage from "../pages/MyBannerBookings";
import BannerBookingDetailsPage from "../pages/MyBannerBookings/Details";
import ReferralsPage from "../pages/Referrals";
import AdminReferralsPage from "../pages/Admin/Referrals";
import AdminReferralDetailsPage from "../pages/Admin/Referrals/Details";
import NotFound from "../pages/NotFound";

const routes = [
  {path: "", element: <Layout/>, children: [
    {index: true, element: <ProtectedRoute><Home/></ProtectedRoute>},
    {path:"create-product", element: <ProtectedRoute> <CreateAd/> </ProtectedRoute>},
    {path:"create-product/:categoryId", element: <ProtectedRoute> <CategoryDetails/> </ProtectedRoute>},
    {path:"create-product/:categoryId/:subCategoryId", element: <ProtectedRoute> <DynamicAdForm/> </ProtectedRoute>},
    {path:"category/:categoryId", element: <ProtectedRoute> <SubCategories/> </ProtectedRoute>},
    { path:"dynamic/:categoryId/:subCategoryId", element:<ProtectedRoute> <DynamicListPage/></ProtectedRoute>},
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

    {path: "/register", element: <Register/>},
    {path: "/login", element: <Login/>},
    {path: "/forgot-password", element: <ForgotPassword/>},
    {path: "/reset-password", element: <ResetPassword/>},
    {path: "/profile", element: <ProtectedRoute><Profile/></ProtectedRoute>},

    // Anything unmatched lands here rather than on a blank page under a
    // working navbar. Kept last so it never shadows a real route.
    {path: "*", element: <NotFound/>},

  ]}
];

/* Registered before any component renders, so a notification arriving on the
   first paint is already checked against the real table. */
registerAppRoutes(routes);

export const router = createBrowserRouter(routes);