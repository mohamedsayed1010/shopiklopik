import {
  AtSign,
  CalendarDays,
  Landmark,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { formatDate } from "../../../utils/format";

function Row({ icon: Icon, label, value, dir }) {
  const empty = value === null || value === undefined || value === "";

  return (
    <div className="flex items-start gap-3.5 px-4 py-3.5 transition-colors duration-200 hover:bg-brand-50/60 sm:px-5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-medium uppercase tracking-wide text-muted">
          {label}
        </p>

        <p
          dir={empty ? undefined : dir}
          className={`mt-1 break-words text-[15px] font-semibold leading-6 ${
            empty ? "text-muted" : "text-ink"
          } ${dir === "ltr" ? "tnum text-start" : ""}`}
        >
          {empty ? "غير محدّد" : value}
        </p>
      </div>
    </div>
  );
}

export default function ProfileInfoCard({ profile }) {
  const fullName =
    [profile?.firstName, profile?.secondName].filter(Boolean).join(" ") || "";

  return (
    <section className="glass overflow-hidden rounded-3xl border border-line shadow-sm">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h2 className="text-[15px] font-bold text-ink">بيانات الحساب</h2>

        <p className="mt-0.5 text-[13px] text-muted">
          البيانات المسجّلة على حسابك في شوبيك لوبيك.
        </p>
      </header>

      <div className="divide-y divide-line">
        <Row icon={UserRound} label="الاسم بالكامل" value={fullName} />

        <Row
          icon={AtSign}
          label="اسم المستخدم"
          value={profile?.username ? `@${profile.username}` : ""}
          dir="ltr"
        />

        <Row icon={Mail} label="البريد الإلكتروني" value={profile?.email} dir="ltr" />

        <Row icon={Phone} label="رقم الهاتف" value={profile?.phone} dir="ltr" />

        <Row icon={MapPin} label="المحافظة" value={profile?.governorate} />

        <Row icon={Landmark} label="المركز" value={profile?.center} />

        <Row
          icon={CalendarDays}
          label="تاريخ الانضمام"
          value={formatDate(profile?.createdAt)}
        />
      </div>
    </section>
  );
}
