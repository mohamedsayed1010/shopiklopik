import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * The visible trail a page's BreadcrumbList describes.
 *
 * `trail` is `[{ label, to }]` from the home page down; the last entry is the
 * current page and is rendered as text. Entries without a label are dropped,
 * so a trail whose names are still loading renders nothing rather than a
 * half-filled row.
 */
export default function Breadcrumbs({ trail, className = "" }) {
  const crumbs = (trail ?? []).filter((crumb) => crumb?.label);

  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="مسار التنقل" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted sm:text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${index}-${crumb.label}`} className="flex items-center gap-1">
              {isLast || !crumb.to ? (
                <span aria-current={isLast ? "page" : undefined} className="font-medium text-ink">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="rounded transition-colors hover:text-brand-900 hover:underline"
                >
                  {crumb.label}
                </Link>
              )}

              {!isLast && <ChevronLeft size={14} aria-hidden="true" className="shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
