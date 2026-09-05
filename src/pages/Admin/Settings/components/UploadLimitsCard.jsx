import { FileText, Film, ImageIcon, Server, SlidersHorizontal } from "lucide-react";

import Skeleton from "../../../../components/ui/Skeleton";
import SettingsSection from "./SettingsSection";
import { formatExtensions, formatMegabytes } from "../settingsConstants";
import { formatNumber } from "../../../../utils/format";

function LimitRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-[12.5px] text-muted">{label}</dt>

      <dd className="text-[13px] font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ExtensionRow({ extensions }) {
  const list = formatExtensions(extensions);

  return (
    <div className="mt-2 border-t border-line pt-2.5">
      <p className="text-[12.5px] text-muted">الامتدادات المسموح بها</p>

      {list ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {list.map((extension) => (
            <li
              key={extension}
              dir="ltr"
              className="rounded-md bg-brand-50 px-2 py-0.5 text-[11.5px] font-semibold text-brand-700"
            >
              {extension}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[12.5px] text-muted">لم يحدّدها الخادم</p>
      )}
    </div>
  );
}

function LimitCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-4">
      <h3 className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
        <Icon size={16} strokeWidth={1.9} aria-hidden="true" className="text-brand-500" />
        {title}
      </h3>

      <dl className="mt-3">{children}</dl>
    </div>
  );
}

export default function UploadLimitsCard({ limits, isLoading }) {
  return (
    <SettingsSection
      icon={SlidersHorizontal}
      title="حدود الرفع"
      description="إعدادات الخادم الحالية للملفات. للعرض فقط — لا يوفّر الـ API طريقة لتعديلها."
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : !limits ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-canvas px-4 py-6 text-center text-sm text-muted">
          لم يُرجع الخادم حدود الرفع.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LimitCard icon={ImageIcon} title="الصور">
              <LimitRow
                label="الحجم الأقصى"
                value={formatMegabytes(limits.imageMaxSizeMb)}
              />

              <LimitRow
                label="أقصى عدد صور للعنصر"
                value={
                  limits.maxImagesPerItem > 0
                    ? formatNumber(limits.maxImagesPerItem)
                    : "غير محدّد"
                }
              />

              <ExtensionRow extensions={limits.imageExtensions} />
            </LimitCard>

            <LimitCard icon={FileText} title="المستندات">
              <LimitRow
                label="الحجم الأقصى"
                value={formatMegabytes(limits.documentMaxSizeMb)}
              />

              <ExtensionRow extensions={limits.documentExtensions} />
            </LimitCard>

            <LimitCard icon={Film} title="الفيديو">
              <LimitRow
                label="الحجم الأقصى"
                value={formatMegabytes(limits.videoMaxSizeMb)}
              />

              <ExtensionRow extensions={limits.videoExtensions} />
            </LimitCard>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas px-4 py-3.5">
            <span className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
              <Server size={16} strokeWidth={1.9} aria-hidden="true" className="text-brand-500" />
              الحد الأقصى لحجم الطلب الواحد
            </span>

            <span className="text-[13px] font-bold text-ink">
              {formatMegabytes(limits.maxRequestBodySizeMb)}
            </span>
          </div>
        </>
      )}
    </SettingsSection>
  );
}
