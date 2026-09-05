import {
  BadgeCheck,
  CreditCard,
  Image as ImageIcon,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Share2,
} from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import Image from "../../../../components/ui/Image";
import UserAvatar from "./UserAvatar";
import useAdminAccess from "../../../../hooks/admin/useAdminPermissions";
import UserReferralsSection from "../../Referrals/components/UserReferralsSection";
import { LISTING_COUNT_FIELDS, userStatusTone } from "../usersConstants";
import { statusTone } from "../../Dashboard/dashboardConstants";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPrice,
} from "../../../../utils/format";

function Row({ label, value, dir, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>

      <dd
        dir={dir}
        className={`min-w-0 break-words text-end text-[13.5px] font-medium text-ink-soft ${
          mono ? "tnum" : ""
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-muted">
          {Icon && <Icon size={15} strokeWidth={2.1} aria-hidden="true" />}
          {title}
        </h3>

        {action}
      </div>

      {children}
    </section>
  );
}

function ContactLink({ href, icon: Icon, children }) {
  if (!children) return null;

  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800"
    >
      <Icon size={13} aria-hidden="true" />
      {children}
    </a>
  );
}

export default function AdminUserDetails({ open, onClose, query, onChangeStatus }) {
  const user = query.data?.data;

  const { canOnRoute } = useAdminAccess();

  const canChangeStatus = canOnRoute("/admin/users", "Manage");

  const listings = user?.listings;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user?.name || user?.userName || "تفاصيل المستخدم"}
      description={user ? `@${user.userName}` : undefined}
      size="lg"
      footer={
        user &&
        canChangeStatus && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => onChangeStatus(user)}>
              <SlidersHorizontal size={15} />
              تغيير حالة الحساب
            </Button>
          </div>
        )
      }
    >
      {query.isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : query.isError ? (
        <ErrorState
          title="تعذّر تحميل بيانات المستخدم"
          description="حدث خطأ أثناء جلب بيانات هذا الحساب. حاول مرة أخرى."
          onRetry={query.refetch}
        />
      ) : !user ? null : (
        <>
          {/* --------------------------- identity --------------------------- */}
          <div className="flex items-start gap-3.5">
            <UserAvatar user={user} size={64} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold text-ink">
                {user.name || "—"}
              </p>

              <p className="truncate text-[12.5px] text-muted">@{user.userName}</p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${userStatusTone(
                    user.statusName
                  )}`}
                >
                  {user.statusName || "—"}
                </span>

                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
                    <ShieldCheck size={12} aria-hidden="true" />
                    مسؤول
                  </span>
                )}

                {user.emailConfirmed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <BadgeCheck size={12} aria-hidden="true" />
                    بريد مُوثّق
                  </span>
                )}

                {/* Distinct from "suspended" — a lockout is the auth system's
                    doing, not a moderator's, so it reads as its own fact. */}
                {user.isLockedOut && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-inset ring-red-200">
                    <Lock size={12} aria-hidden="true" />
                    مقفل مؤقتًا
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* --------------------------- listings --------------------------- */}
          {listings && (
            <Section title="الإعلانات" icon={Megaphone}>
              <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {LISTING_COUNT_FIELDS.map((field) => {
                  const value = listings[field.key] ?? 0;

                  return (
                    <div
                      key={field.key}
                      className="rounded-xl border border-line bg-canvas px-2 py-2.5 text-center"
                    >
                      <dt className="text-[10.5px] text-muted">{field.label}</dt>

                      <dd
                        className={`tnum mt-0.5 text-[15px] font-extrabold ${
                          field.emphasis && value > 0
                            ? "text-red-600"
                            : "text-ink"
                        }`}
                      >
                        {formatNumber(value)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </Section>
          )}

          {/* ---------------------------- contact --------------------------- */}
          <Section title="بيانات التواصل" icon={Phone}>
            <dl>
              <Row
                label="الهاتف"
                dir="ltr"
                mono
                value={
                  <ContactLink href={`tel:${user.phone}`} icon={Phone}>
                    {user.phone}
                  </ContactLink>
                }
              />

              <Row
                label="واتساب"
                dir="ltr"
                mono
                value={
                  user.whatsApp ? (
                    <ContactLink
                      href={`https://wa.me/${String(user.whatsApp).replace(/\D/g, "")}`}
                      icon={MessageCircle}
                    >
                      {user.whatsApp}
                    </ContactLink>
                  ) : null
                }
              />

              <Row
                label="البريد الإلكتروني"
                dir="ltr"
                value={
                  <ContactLink href={`mailto:${user.email}`} icon={Mail}>
                    {user.email}
                  </ContactLink>
                }
              />

              <Row
                label="المنطقة"
                value={
                  user.governorate || user.center ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} aria-hidden="true" className="text-muted" />
                      {[user.governorate, user.center].filter(Boolean).join(" — ")}
                    </span>
                  ) : null
                }
              />
            </dl>
          </Section>

          {/* ----------------------------- account -------------------------- */}
          <Section title="الحساب" icon={ShieldCheck}>
            <dl>
              <Row label="تاريخ التسجيل" value={formatDateTime(user.createdAt)} mono />

              <Row label="آخر تحديث" value={formatDateTime(user.updatedAt)} mono />

              {/* Only meaningful once a moderator has actually acted. */}
              {user.statusChangedAt && (
                <Row
                  label="تاريخ تغيير الحالة"
                  value={formatDateTime(user.statusChangedAt)}
                  mono
                />
              )}

              {user.statusReason && (
                <Row label="سبب تغيير الحالة" value={user.statusReason} />
              )}

              <Row label="المعرّف" value={user.id} dir="ltr" mono />
            </dl>
          </Section>

          {/* ------------------------- referrals ------------------------ */}
          {/* `GET /api/v2/admin/users/{userId}/referrals` — the same admin
              endpoint the referral centre uses, scoped to this account. */}
          <Section title="الدعوات" icon={Share2}>
            <UserReferralsSection userId={user.id} />
          </Section>

          {/* ---------------------- money & banners -------------------- */}
          {(user.totalPaid > 0 || user.activeBannersCount > 0) && (
            <Section title="المدفوعات والبانرات" icon={CreditCard}>
              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-canvas px-3 py-2.5">
                  <dt className="text-[11px] text-muted">إجمالي المدفوع</dt>
                  <dd className="tnum mt-0.5 text-[15px] font-extrabold text-ink">
                    {formatNumber(Math.round(user.totalPaid ?? 0))}
                  </dd>
                </div>

                <div className="rounded-xl border border-line bg-canvas px-3 py-2.5">
                  <dt className="text-[11px] text-muted">بانرات نشطة</dt>
                  <dd className="tnum mt-0.5 text-[15px] font-extrabold text-ink">
                    {formatNumber(user.activeBannersCount ?? 0)}
                  </dd>
                </div>
              </dl>
            </Section>
          )}

          {/* --------------------------- recent ads ------------------------- */}
          {user.recentAds?.length > 0 && (
            <Section title="أحدث إعلاناته" icon={Megaphone}>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {user.recentAds.slice(0, 5).map((ad) => (
                  <li key={ad.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Image
                      src={resolveMediaUrl(ad.mainImageUrl)}
                      alt=""
                      ratio=""
                      className="h-10 w-10 shrink-0 rounded-lg"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink">
                        {ad.title || "بدون عنوان"}
                      </p>

                      <p className="truncate text-[11px] text-muted">
                        {[ad.categoryName, ad.subCategoryName]
                          .filter(Boolean)
                          .join(" • ")}{" "}
                        · {formatDate(ad.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tnum text-[12px] font-bold text-brand-800">
                        {formatPrice(ad.price) ?? "—"}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${statusTone(
                          ad.status
                        )}`}
                      >
                        {ad.moderation?.statusName || ad.status || "—"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* --------------------------- payments --------------------------- */}
          {user.payments?.length > 0 && (
            <Section title="أحدث المدفوعات" icon={CreditCard}>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {user.payments.slice(0, 5).map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-ink-soft">
                        {payment.paymentMethodName || "—"}
                      </p>

                      <p className="truncate text-[11px] text-muted">
                        {formatDate(payment.submittedAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tnum text-[12px] font-bold text-brand-800">
                        {formatNumber(Math.round(payment.amount ?? 0))}{" "}
                        {payment.currency || ""}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${statusTone(
                          payment.status
                        )}`}
                      >
                        {payment.statusName || "—"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* ----------------------- banner requests ------------------------ */}
          {user.bannerRequests?.length > 0 && (
            <Section title="طلبات البانر" icon={ImageIcon}>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {user.bannerRequests.slice(0, 5).map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-ink-soft">
                        {request.title || "—"}
                      </p>

                      <p className="truncate text-[11px] text-muted">
                        {request.locationName || "—"} ·{" "}
                        {formatDate(request.submittedAt)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${statusTone(
                        request.status
                      )}`}
                    >
                      {request.statusName || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </Modal>
  );
}
