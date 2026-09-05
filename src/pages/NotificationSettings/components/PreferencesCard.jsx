import { BellRing } from "lucide-react";

import Switch from "../../../components/ui/Switch";
import Skeleton from "../../../components/ui/Skeleton";
import ErrorState from "../../../components/ui/ErrorState";

export default function PreferencesCard({
  query,
  mutation,
  newListingsEnabled,
}) {
  return (
    <section className="glass relative overflow-hidden rounded-3xl border border-line p-5 shadow-sm sm:p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 h-40 w-40 rounded-full bg-brand-200/35 blur-3xl end-[-2rem]"
      />

      <div className="relative">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 text-gold-300 shadow-sm">
          <BellRing size={20} strokeWidth={1.9} aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-[15px] font-bold text-ink sm:text-base">
          تنبيهات الإعلانات الجديدة
        </h2>

        <p className="mt-1.5 text-[13px] leading-6 text-muted">
          نرسل لك إشعارًا عند نشر إعلان جديد في الأقسام التي تتابعها. أوقف هذا
          الخيار لإيقاف تنبيهات الإعلانات الجديدة كلها دون فقدان اهتماماتك.
        </p>

        {query.isLoading ? (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ) : query.isError ? (
          <ErrorState
            title="تعذّر تحميل الإعدادات"
            description="تحقّق من اتصالك بالإنترنت وحاول مرة أخرى."
            onRetry={query.refetch}
            className="mt-5 py-10"
          />
        ) : (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
            <span className="text-sm font-semibold text-ink">
              تفعيل تنبيهات الإعلانات الجديدة
            </span>

            <Switch
              checked={newListingsEnabled}
              busy={mutation.isPending}
              label="تفعيل تنبيهات الإعلانات الجديدة"
              onChange={(next) =>
                mutation.mutate({ newListingsEnabled: next })
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}
