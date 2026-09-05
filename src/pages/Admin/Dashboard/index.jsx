import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../../../components/Seo";
import { LayoutDashboard, RotateCw, ShieldCheck } from "lucide-react";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import DashboardStats from "./components/DashboardStats";
import QuickActions from "./components/QuickActions";
import {
  LatestAds,
  LatestBannerRequests,
} from "./components/LatestLists";
import AnalyticsSection from "./components/AnalyticsSection";
import {
  useAdminAnalytics,
  useAdminDashboard,
  useRefreshAdminDashboard,
} from "../../../hooks/admin/useAdminDashboard";
import {
  DEFAULT_RANGE_KEY,
  RANGE_PRESETS,
  presetToDates,
  rangeToParams,
} from "./dashboardConstants";
import { formatDateTime } from "../../../utils/format";
import BackButton from "../../../components/ui/BackButton";

/** 401 and 403 are answers, not outages — neither offers a retry. */
function AuthState({ status }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">
        {status === 401 ? "انتهت صلاحية جلستك" : "لا تملك صلاحية الوصول"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        {status === 401
          ? "سجّل الدخول مرة أخرى للمتابعة."
          : "هذه الصفحة مخصّصة لحسابات الإدارة فقط."}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [rangeKey, setRangeKey] = useState(DEFAULT_RANGE_KEY);

  const [dates, setDates] = useState(() =>
    presetToDates(RANGE_PRESETS.find((r) => r.key === DEFAULT_RANGE_KEY).days)
  );

  const dashboardQuery = useAdminDashboard({ latest: 5 });

  const analyticsQuery = useAdminAnalytics(rangeToParams(dates));

  const refreshAll = useRefreshAdminDashboard();

  const data = dashboardQuery.data?.data;

  const status = dashboardQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  const onPresetChange = useCallback((key) => {
    setRangeKey(key);

    const preset = RANGE_PRESETS.find((r) => r.key === key);

    // "custom" keeps whatever dates are already in the inputs.
    if (preset?.days) setDates(presetToDates(preset.days));
  }, []);

  const onDateChange = useCallback((field, value) => {
    setDates((previous) => ({ ...previous, [field]: value }));
  }, []);

  const errorCopy = useMemo(() => {
    if (status === 429) {
      return {
        title: "عدد كبير من الطلبات",
        description: "تم تجاوز الحد المسموح مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
      };
    }

    if (status >= 500) {
      return {
        title: "خطأ في الخادم",
        description: "تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.",
      };
    }

    return {
      title: "تعذّر تحميل لوحة التحكم",
      description: "تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.",
    };
  }, [status]);

  const isRefreshing =
    (dashboardQuery.isFetching && !dashboardQuery.isLoading) ||
    (analyticsQuery.isFetching && !analyticsQuery.isLoading);

  return (
    <>
      <Seo title="لوحة التحكم | الإدارة" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1400px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <LayoutDashboard size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                لوحة التحكم
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                نظرة عامة على نشاط المنصة.
                {data?.generatedAt && (
                  <span className="tnum">
                    {" "}
                    آخر تحديث: {formatDateTime(data.generatedAt)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            loading={isRefreshing}
          >
            <RotateCw size={15} />
            تحديث
          </Button>
        </header>

        {isAuthError ? (
          <AuthState status={status} />
        ) : dashboardQuery.isError ? (
          <ErrorState
            title={errorCopy.title}
            description={errorCopy.description}
            onRetry={dashboardQuery.refetch}
          />
        ) : (
          <div className="space-y-6">
            <DashboardStats
              stats={data?.stats}
              isLoading={dashboardQuery.isLoading}
            />

            <QuickActions
              actions={data?.quickActions}
              isLoading={dashboardQuery.isLoading}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LatestAds
                ads={data?.latestAds}
                isLoading={dashboardQuery.isLoading}
                onOpen={(ad) =>
                  navigate(
                    `/admin/ads?type=${ad.typeId}&search=${encodeURIComponent(
                      ad.title ?? ""
                    )}`
                  )
                }
              />

              <LatestBannerRequests
                requests={data?.latestBannerRequests}
                isLoading={dashboardQuery.isLoading}
              />

            </div>

            <AnalyticsSection
              analytics={analyticsQuery.data?.data}
              query={analyticsQuery}
              rangeKey={rangeKey}
              dates={dates}
              onPresetChange={onPresetChange}
              onDateChange={onDateChange}
            />
          </div>
        )}
      </div>
    </>
  );
}
