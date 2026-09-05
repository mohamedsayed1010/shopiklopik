import { useNavigate, useParams } from "react-router-dom";
import Seo from "../../../components/Seo";
import {
  ArrowLeftRight,
  Hash,
  RotateCw,
  SearchX,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import EmptyState from "../../../components/ui/EmptyState";
import PageHeader from "../../../components/ui/PageHeader";
import Skeleton from "../../../components/ui/Skeleton";
import { useAdminReferralDetails } from "../../../hooks/admin/useAdminReferrals";
import { formatDateTime } from "../../../utils/format";
import {
  referralInitials,
  referralStatusTone,
} from "../../Referrals/referralsConstants";

function Row({ label, value, dir }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <span className="text-[13px] text-muted">{label}</span>

      <span
        dir={dir}
        className="min-w-0 max-w-full truncate text-sm font-semibold text-ink"
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function PartyCard({ title, name, userName, userId }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-xs">
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-ink">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <UserRound size={18} strokeWidth={2} aria-hidden="true" />
        </span>
        {title}
      </h2>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
          {referralInitials(name, userName)}
        </span>

        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{name || "—"}</p>

          <p dir="ltr" className="truncate text-start text-[13px] text-muted">
            {userName ? `@${userName}` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-1">
        <Row label="معرّف الحساب" value={userId} dir="ltr" />
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="rounded-3xl border border-line bg-surface p-5 shadow-xs"
          >
            <Skeleton className="h-4 w-24" />

            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            </div>

            <Skeleton className="mt-5 h-3 w-2/3" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5 shadow-xs">
        <Skeleton className="h-4 w-28" />

        <div className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminReferralDetailsPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const { detailsQuery, referral } = useAdminReferralDetails({ id });

  const status = detailsQuery.error?.response?.status;

  const message = detailsQuery.error?.response?.data?.message;

  return (
    <>
      <Seo title="تفاصيل الدعوة | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          title="تفاصيل الدعوة"
          subtitle="سجل دعوة واحد كما تعيده الواجهة الخلفية."
          className="mb-6"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => detailsQuery.refetch()}
              loading={detailsQuery.isFetching && !detailsQuery.isLoading}
            >
              <RotateCw size={15} />
              تحديث
            </Button>
          }
        />

        {detailsQuery.isLoading ? (
          <DetailsSkeleton />
        ) : status === 401 || status === 403 ? (
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
                : "تفاصيل الدعوات مخصّصة لحسابات الإدارة فقط."}
            </p>
          </div>
        ) : status === 404 ? (
          <EmptyState
            icon={SearchX}
            title="الدعوة غير موجودة"
            description={message || "لا توجد دعوة بهذا المعرّف."}
            action={
              <Button variant="outline" onClick={() => navigate("/admin/referrals")}>
                العودة إلى قائمة الدعوات
              </Button>
            }
          />
        ) : detailsQuery.isError ? (
          <ErrorState
            title={
              status === 429
                ? "عدد كبير من الطلبات"
                : status >= 500
                ? "خطأ في الخادم"
                : "تعذّر تحميل التفاصيل"
            }
            description={message || "حدث خطأ أثناء جلب تفاصيل الدعوة."}
            onRetry={detailsQuery.refetch}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <PartyCard
                title="الداعي"
                name={referral?.referrerName}
                userName={referral?.referrerUserName}
                userId={referral?.referrerUserId}
              />

              <PartyCard
                title="المدعو"
                name={referral?.referredName}
                userName={referral?.referredUserName}
                userId={referral?.referredUserId}
              />
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5 shadow-xs sm:p-6">
              <h2 className="flex items-center gap-2.5 text-sm font-bold text-ink">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
                  <ArrowLeftRight size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                بيانات الدعوة
              </h2>

              <div className="mt-4">
                <Row label="معرّف الدعوة" value={referral?.id} dir="ltr" />

                <Row
                  label="كود الدعوة"
                  value={referral?.referralCode}
                  dir="ltr"
                />

                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-3">
                  <span className="text-[13px] text-muted">الحالة</span>

                  {referral?.statusName ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${referralStatusTone(
                        referral.statusName
                      )}`}
                    >
                      {referral.statusName}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )}
                </div>

                <Row
                  label="تاريخ الإنشاء"
                  value={
                    referral?.createdAt ? formatDateTime(referral.createdAt) : null
                  }
                />

                <Row
                  label="تاريخ الاكتمال"
                  value={
                    referral?.completedAt
                      ? formatDateTime(referral.completedAt)
                      : null
                  }
                />
              </div>
            </div>

            <p className="flex items-center gap-2 px-1 text-[12px] text-muted">
              <Hash size={13} aria-hidden="true" />
              هذه الصفحة للعرض فقط — لا تتيح الواجهة الخلفية أي تعديل على
              الدعوات.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
