import { lazy } from "react";


export const Login = lazy(() => import("../components/Login/Login"));
export const Register = lazy(() => import("../components/Register/Register"));
export const ForgotPassword = lazy(
  () => import("../components/ForgetPassword/ForgotPassword")
);
export const ResetPassword = lazy(
  () => import("../components/ResetPassword/ResetPassword")
);

export const AboutPage = lazy(() => import("../pages/About"));
export const ContactPage = lazy(() => import("../pages/Contact"));
export const TermsPage = lazy(() => import("../pages/Terms"));
export const PrivacyPage = lazy(() => import("../pages/Privacy"));
export const NotFound = lazy(() => import("../pages/NotFound"));

export const SubCategories = lazy(
  () => import("../components/Home/CategoriesSlider/SubCategories/SubCategories")
);
export const DynamicListPage = lazy(() => import("../pages/DynamicList"));

/* The reader's own things. */
export const Profile = lazy(() => import("../pages/Profile/Profile"));

/* The profile form as a page — and the one destination an account short of its
   required data may open. See `ProfileCompletionGuard`. */
export const EditProfilePage = lazy(
  () => import("../pages/Profile/updateprofile/EditProfilePage")
);
export const FavoritesPage = lazy(() => import("../pages/Favorites"));
export const NotificationSettingsPage = lazy(
  () => import("../pages/NotificationSettings")
);
export const ReferralsPage = lazy(() => import("../pages/Referrals"));

/* One ad, in full, and the form that edits it. */
export const DynamicDetailsPage = lazy(() => import("../pages/DynamicDetails"));
export const EditListingPage = lazy(() => import("../pages/EditListing"));

/* The compose flow: pick a category, pick a section, fill the dynamic form. */
export const CreateAd = lazy(() => import("../components/CreateAd/CreateAd"));
export const CategoryDetails = lazy(
  () => import("../components/CreateAd/CategoryDetails")
);
export const DynamicAdForm = lazy(
  () => import("../components/CreateAd/DynamicAdForm")
);

/* Money. `BannerBooking` is also the only importer of the image cropper. */
export const MyPaymentsPage = lazy(() => import("../pages/Payments"));
export const NewPaymentPage = lazy(() => import("../pages/Payments/NewPayment"));
export const PaymentDetailsPage = lazy(
  () => import("../pages/Payments/PaymentDetails")
);
export const BannerBookingPage = lazy(() => import("../pages/BannerBooking"));
export const MyBannerBookingsPage = lazy(
  () => import("../pages/MyBannerBookings")
);
export const BannerBookingDetailsPage = lazy(
  () => import("../pages/MyBannerBookings/Details")
);

/* The console. Fifteen pages, and the only importer of the spreadsheet writer. */
export const AdminDashboardPage = lazy(() => import("../pages/Admin/Dashboard"));
export const AdminAdsPage = lazy(() => import("../pages/Admin/Ads"));
export const AdminUsersPage = lazy(() => import("../pages/Admin/Users"));
export const AdminAccountsPage = lazy(() => import("../pages/Admin/Accounts"));
export const AdminAccountCreatePage = lazy(
  () => import("../pages/Admin/Accounts/Create")
);
export const AdminAccountPermissionsPage = lazy(
  () => import("../pages/Admin/Accounts/Permissions")
);
export const AdminReportsPage = lazy(() => import("../pages/Admin/Reports"));
export const AdminFeedbackPage = lazy(() => import("../pages/Admin/Feedback"));
export const AdminAuditLogsPage = lazy(() => import("../pages/Admin/AuditLogs"));
export const AdminSettingsPage = lazy(() => import("../pages/Admin/Settings"));
export const AdminPaymentMethodsPage = lazy(
  () => import("../pages/Admin/PaymentMethods")
);
export const AdminBannersPage = lazy(() => import("../pages/Admin/Banners"));
export const AdminReferralsPage = lazy(() => import("../pages/Admin/Referrals"));
export const AdminReferralDetailsPage = lazy(
  () => import("../pages/Admin/Referrals/Details")
);
