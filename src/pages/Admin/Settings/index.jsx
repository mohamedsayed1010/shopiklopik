import { useEffect, useMemo, useRef } from "react";
import Seo from "../../../components/Seo";
import { useFormik } from "formik";
import {
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  RotateCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import SettingsSection from "./components/SettingsSection";
import SettingsSaveBar from "./components/SettingsSaveBar";
import BrandingUploader from "./components/BrandingUploader";
import UploadLimitsCard from "./components/UploadLimitsCard";
import {
  ContactSection,
  ContentSection,
  GeneralSection,
  MaintenanceSection,
  SocialSection,
} from "./components/SettingsForm";
import {
  BRANDING_UPLOADS,
  settingsValidationSchema,
  toFormValues,
} from "./settingsConstants";
import {
  settingsErrorCopy,
  useAdminSettings,
  useResolvedUploadLimits,
  useSaveAdminSettings,
  useUploadSettingsFavicon,
  useUploadSettingsLogo,
} from "../../../hooks/admin/useAdminSettings";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import { formatDateTime } from "../../../utils/format";
import BackButton from "../../../components/ui/BackButton";

function ForbiddenState({ status }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">
        {status === 401
          ? "انتهت صلاحية جلستك"
          : "لا تملك صلاحية إدارة إعدادات المنصة"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        {status === 401
          ? "سجّل الدخول مرة أخرى للمتابعة."
          : "هذه الصفحة مخصّصة لحسابات الإدارة فقط."}
      </p>
    </div>
  );
}

/** The rejected-field list a 400/422 came back with. */
function ServerErrors({ errors }) {
  if (!errors.length) return null;

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5"
    >
      <p className="flex items-center gap-2 text-sm font-bold text-red-700">
        <AlertCircle size={16} aria-hidden="true" />
        رفض الخادم الحفظ
      </p>

      <ul className="mt-2 space-y-1 ps-6 text-[13px] leading-6 text-red-700">
        {errors.map((message) => (
          <li key={message} className="list-disc">
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminSettingsPage() {
  const settingsQuery = useAdminSettings();

  const settings = settingsQuery.data?.data ?? null;

  const { limits, limitsQuery } = useResolvedUploadLimits(settings);

  const logoUpload = useUploadSettingsLogo();

  const faviconUpload = useUploadSettingsFavicon();

  const initialValues = useMemo(() => toFormValues(settings), [settings]);

  const { saveMutation, fieldErrors, clearFieldErrors } = useSaveAdminSettings();

  const formik = useFormik({
    initialValues,
    validationSchema: settingsValidationSchema,
    // Seeding is driven by the effect below, which refuses to overwrite edits.
    enableReinitialize: false,
    onSubmit: (values) => {
      if (saveMutation.isPending) return;

      saveMutation.mutate(values, {
        /* Re-baseline from the server's own answer, not from what was typed:
           the response is the row as stored, so the form stops being dirty
           against the truth rather than against the submission. */
        onSuccess: (response) =>
          formik.resetForm({ values: toFormValues(response?.data ?? values) }),
      });
    },
  });

  const seededFrom = useRef(null);

  const formikRef = useRef(formik);

  useEffect(() => {
    formikRef.current = formik;
  });

  useEffect(() => {
    if (!settings || seededFrom.current === settings) return;

    if (seededFrom.current !== null && formikRef.current.dirty) return;

    seededFrom.current = settings;

    formikRef.current.resetForm({ values: toFormValues(settings) });
  }, [settings]);

  const status = settingsQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  const errorCount = Object.keys(formik.errors).length;

  const isRefreshing = settingsQuery.isFetching && !settingsQuery.isLoading;

  const currentLogo = resolveMediaUrl(settings?.logoUrl);

  const currentFavicon = resolveMediaUrl(settings?.faviconUrl);

  return (
    <>
      <Seo title="إعدادات المنصة | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-32 sm:px-6 lg:px-8 lg:py-10">
        {/* Returns to wherever this screen was opened from, query string
            and all — the shared control the user-facing pages use. */}
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <SlidersHorizontal size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                إعدادات المنصة
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {settings?.updatedAt
                  ? `آخر تحديث: ${formatDateTime(settings.updatedAt)}`
                  : "بيانات الموقع التي تظهر للزوّار في كل صفحة."}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => settingsQuery.refetch()}
            loading={isRefreshing}
          >
            <RotateCw size={15} />
            تحديث
          </Button>
        </header>

        {settingsQuery.isLoading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-3xl" />
            ))}
          </div>
        ) : isAuthError ? (
          <ForbiddenState status={status} />
        ) : settingsQuery.isError ? (
          <ErrorState
            {...settingsErrorCopy(settingsQuery.error)}
            onRetry={settingsQuery.refetch}
          />
        ) : (
          <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
            {fieldErrors.length > 0 && <ServerErrors errors={fieldErrors} />}

            <GeneralSection formik={formik} />

            <SettingsSection
              icon={ImageIcon}
              title="هوية الموقع"
              description="الشعار والأيقونة يُرفعان فورًا عبر نقطتَي نهاية مستقلّتين — لا ينتظران زر الحفظ."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <BrandingUploader
                  config={BRANDING_UPLOADS.logo}
                  currentUrl={currentLogo}
                  limits={limits}
                  mutation={logoUpload.mutation}
                  progress={logoUpload.progress}
                />

                <BrandingUploader
                  config={BRANDING_UPLOADS.favicon}
                  currentUrl={currentFavicon}
                  limits={limits}
                  mutation={faviconUpload.mutation}
                  progress={faviconUpload.progress}
                />
              </div>
            </SettingsSection>

            <ContactSection formik={formik} />

            <SocialSection formik={formik} />

            <ContentSection formik={formik} />

            <MaintenanceSection formik={formik} />

            <UploadLimitsCard
              limits={limits}
              isLoading={limitsQuery.isLoading}
            />

            <SettingsSection
              icon={Sparkles}
              title="أين تظهر هذه الإعدادات"
              description="الصفحات العامة التي تقرأ من هذه البيانات مباشرة."
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                {[
                  { to: "/about", label: "من نحن" },
                  { to: "/contact", label: "تواصل معنا" },
                  { to: "/terms", label: "الشروط والأحكام" },
                  { to: "/privacy", label: "سياسة الخصوصية" },
                ].map((page) => (
                  <li key={page.to}>
                    <Link
                      to={page.to}
                      className="flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-4 py-3 text-[13px] font-medium text-ink-soft transition-colors duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900"
                    >
                      {page.label}

                      <ExternalLink
                        size={14}
                        aria-hidden="true"
                        className="shrink-0 text-line-strong"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </SettingsSection>
          </form>
        )}
      </div>

      <SettingsSaveBar
        visible={formik.dirty && !settingsQuery.isLoading && !isAuthError}
        saving={saveMutation.isPending}
        canSave={errorCount === 0 && !saveMutation.isPending}
        errorCount={errorCount}
        onSave={formik.handleSubmit}
        onReset={() => {
          formik.resetForm({ values: toFormValues(settings) });

          clearFieldErrors();
        }}
      />
    </>
  );
}
