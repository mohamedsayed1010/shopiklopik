import { Link } from "react-router-dom";
import { ChevronLeft, Zap } from "lucide-react";

import Skeleton from "../../../../components/ui/Skeleton";
import { isRouteImplemented } from "../dashboardConstants";
import { formatNumber } from "../../../../utils/format";

/** The server's key for the payment review queue, which this page does not show. */
const HIDDEN_ACTION_KEYS = ["review-payments"];

function Card({ action }) {
  const isLive = isRouteImplemented(action.route);

  const urgent = action.isUrgent && action.count > 0;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden="true"
          className="text-xl leading-none"
          /* The icon is an emoji the server chose; rendered as text so a glyph
             this app has never seen still appears. */
        >
          {action.icon || "•"}
        </span>

        {urgent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10.5px] font-bold text-white">
            عاجل
          </span>
        )}
      </div>

      <p className="mt-2.5 text-[13px] font-semibold text-ink">
        {action.label}
      </p>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span
          className={`text-xl font-extrabold ${
            urgent ? "text-red-600" : "text-ink-soft"
          }`}
        >
          {formatNumber(action.count ?? 0)}
        </span>

        {isLive ? (
          <ChevronLeft size={16} aria-hidden="true" className="text-line-strong" />
        ) : (
          <span className="text-[10.5px] text-muted">لم تُضف بعد</span>
        )}
      </div>
    </>
  );

  const shell = `flex flex-col rounded-2xl border bg-surface p-3.5 shadow-xs transition-[border-color,box-shadow,transform] duration-200 ${
    urgent ? "border-red-200" : "border-line"
  }`;

  if (!isLive) {
    return (
      <li className={`${shell} opacity-70`} aria-disabled="true">
        {body}
      </li>
    );
  }

  return (
    <li>
      <Link
        to={action.route}
        className={`${shell} h-full hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md`}
      >
        {body}
      </Link>
    </li>
  );
}

export default function QuickActions({ actions, isLoading }) {
  const visible = (actions ?? []).filter(
    (action) => !HIDDEN_ACTION_KEYS.includes(action.key)
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!visible.length) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
        <Zap size={17} strokeWidth={2.1} aria-hidden="true" className="text-gold-500" />
        إجراءات سريعة
      </h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((action) => (
          <Card key={action.key} action={action} />
        ))}
      </ul>
    </section>
  );
}
