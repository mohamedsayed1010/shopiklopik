import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import useSiteSettings from "../../hooks/useSiteSettings";

export default function MaintenanceBanner() {
  const { settings, isFromApi } = useSiteSettings();

  if (!isFromApi || !settings.maintenanceMode) return null;

  return (
    <div
      role="status"
      className="border-b border-gold-300 bg-gold-50 print:hidden"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 text-[13px] font-bold text-gold-700">
          <ShieldAlert size={16} strokeWidth={2} aria-hidden="true" />
          وضع الصيانة مُفعّل
        </span>

        {settings.maintenanceMessage && (
          <span className="min-w-0 flex-1 truncate text-[12.5px] leading-6 text-ink-soft">
            {settings.maintenanceMessage}
          </span>
        )}

        <Link
          to="/admin/settings"
          className="shrink-0 text-[12.5px] font-semibold text-brand-800 underline decoration-gold-400 underline-offset-4 transition-colors duration-200 hover:text-brand-950"
        >
          إدارة الإعدادات
        </Link>
      </div>
    </div>
  );
}
