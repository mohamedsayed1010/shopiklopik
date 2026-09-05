import { useMemo } from "react";
import { Check, KeyRound, LayoutGrid, ShieldCheck } from "lucide-react";

import Button from "../../../../components/ui/Button";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import { formatNumber } from "../../../../utils/format";
import { pageLabel } from "../../../../utils/adminPermissions";

function PageMark({ page }) {
  return (
    <LayoutGrid
      size={15}
      strokeWidth={2}
      aria-hidden="true"
      title={page.icon ?? undefined}
      className="shrink-0 text-brand-400"
    />
  );
}

function PermissionChip({ permission, checked, disabled, onToggle }) {
  return (
    <label
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-[background-color,border-color,color] duration-150 ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-brand-300"
      } ${
        checked
          ? "border-brand-900 bg-brand-900 text-white"
          : "border-line-strong bg-surface text-ink-soft"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle(permission.value)}
      />

      <span
        aria-hidden="true"
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border ${
          checked ? "border-white/70 bg-white/20" : "border-line-strong"
        }`}
      >
        {checked && <Check size={11} strokeWidth={3.5} />}
      </span>

      {permission.label}
    </label>
  );
}

function PageCard({ page, granted, disabled, onTogglePage, onTogglePermission }) {
  const total = page.permissions.length;

  const count = granted.size;

  const isOn = count > 0;

  return (
    <li
      className={`rounded-2xl border p-4 transition-[border-color,background-color] duration-200 ${
        isOn ? "border-brand-200 bg-brand-50/40" : "border-line bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <label
          className={`flex min-w-0 items-start gap-3 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={isOn}
            disabled={disabled || total === 0}
            onChange={() => onTogglePage(page)}
          />

          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${
              isOn
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-line-strong bg-surface"
            }`}
          >
            {isOn && <Check size={13} strokeWidth={3.5} />}
          </span>

          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              {/* The server names an icon from a set this app does not ship —
                  `"layout-dashboard"`, `"map-pin"` — so a neutral mark stands in
                  rather than the raw string. See `PageMark`. */}
              <PageMark page={page} />

              <span className="text-[14px] font-bold text-ink">
                {pageLabel(page)}
              </span>
            </span>

            {page.route && (
              <span
                dir="ltr"
                className="mt-0.5 block truncate text-start text-[11.5px] text-muted"
              >
                {page.route}
              </span>
            )}
          </span>
        </label>

        {total > 0 && (
          <span
            className={`tnum shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isOn ? "bg-brand-900 text-white" : "bg-canvas text-muted"
            }`}
          >
            {formatNumber(count)} / {formatNumber(total)}
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="mt-3 text-[12px] leading-6 text-muted">
          لم تُعرَّف صلاحيات لهذه الصفحة.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {page.permissions.map((permission) => (
            <PermissionChip
              key={permission.value}
              permission={permission}
              checked={granted.has(permission.value)}
              disabled={disabled}
              onToggle={(value) => onTogglePermission(page, value)}
            />
          ))}
        </div>
      )}
    </li>
  );
}

const STICKY_TOOLBAR =
  "sticky -top-5 z-10 -mx-5 px-5 pt-5 sm:-top-6 sm:-mx-6 sm:px-6 sm:pt-6";

const STATIC_TOOLBAR = "pt-1";

export default function PagePermissionsPicker({
  groups,
  pages,
  selection,
  onChange,
  disabled = false,
  query,
  /** Pin the counter and the select-all controls to the scroll container. */
  stickyToolbar = true,
}) {
  const totals = useMemo(() => {
    const grantedPages = Object.values(selection).filter(
      (set) => set && set.size > 0
    );

    return {
      pages: grantedPages.length,
      permissions: grantedPages.reduce((sum, set) => sum + set.size, 0),
    };
  }, [selection]);

  const grantedFor = (pageKey) => selection[pageKey] ?? new Set();

  const write = (pageKey, next) => {
    const updated = { ...selection };

    if (next.size === 0) delete updated[pageKey];
    else updated[pageKey] = next;

    onChange(updated);
  };

  /* A page toggle is "everything or nothing": with nothing granted it grants
     every permission the page defines, and with anything granted it clears. */
  const onTogglePage = (page) => {
    const current = grantedFor(page.pageKey);

    write(
      page.pageKey,
      current.size > 0
        ? new Set()
        : new Set(page.permissions.map((permission) => permission.value))
    );
  };

  const onTogglePermission = (page, value) => {
    const next = new Set(grantedFor(page.pageKey));

    if (next.has(value)) next.delete(value);
    else next.add(value);

    write(page.pageKey, next);
  };

  const selectAll = () => {
    const updated = {};

    pages.forEach((page) => {
      if (page.permissions.length === 0) return;

      updated[page.pageKey] = new Set(
        page.permissions.map((permission) => permission.value)
      );
    });

    onChange(updated);
  };

  if (query?.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (query?.isError) {
    return (
      <ErrorState
        title="تعذّر تحميل قائمة الصلاحيات"
        description="لم نتمكن من جلب الصفحات والصلاحيات المتاحة. حاول مرة أخرى."
        onRetry={query.refetch}
      />
    );
  }

  if (pages.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="لا توجد صفحات معرّفة"
        description="لم يُرجِع الخادم أي صفحات يمكن منح صلاحيات عليها."
      />
    );
  }

  return (
    <div>
      <div
        className={`mb-4 flex flex-wrap items-center justify-between gap-3 bg-surface pb-3 ${
          stickyToolbar ? STICKY_TOOLBAR : STATIC_TOOLBAR
        }`}
      >
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <ShieldCheck size={15} aria-hidden="true" className="text-brand-400" />

          <span className="tnum">
            {formatNumber(totals.pages)} صفحة · {formatNumber(totals.permissions)}{" "}
            صلاحية
          </span>
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={selectAll}
          >
            تحديد الكل
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || totals.pages === 0}
            onClick={() => onChange({})}
          >
            مسح الكل
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.group ?? "__ungrouped"}>
            {/* Only the server's own group names appear as headings; pages it
                sent no group for are listed without one. */}
            {group.group && (
              <h4 className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-muted">
                {group.group}
              </h4>
            )}

            <ul className="space-y-3">
              {group.pages.map((page) => (
                <PageCard
                  key={page.pageKey}
                  page={page}
                  granted={grantedFor(page.pageKey)}
                  disabled={disabled}
                  onTogglePage={onTogglePage}
                  onTogglePermission={onTogglePermission}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
