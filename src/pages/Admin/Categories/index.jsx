import { useMemo, useState } from "react";
import {
  ChevronDown,
  Eye,
  FolderTree,
  Layers,
  RotateCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import Seo from "../../../components/Seo";
import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import Switch from "../../../components/ui/Switch";
import { inputClass, selectClass } from "../../../components/ui/formStyles";
import useAdminAccess from "../../../hooks/admin/useAdminPermissions";
import {
  useAdminCategories,
  useDeleteSubCategory,
  useToggleSubCategoryStatus,
} from "../../../hooks/admin/useAdminCategories";
import { formatNumber } from "../../../utils/format";
import { ActiveBadge, SystemBadge } from "./components/CategoryBadges";
import SubCategoryDetailsModal from "./components/SubCategoryDetailsModal";

const ROUTE = "/admin/categories";

const STATUS_FILTERS = [
  { value: "all", label: "كل الحالات" },
  { value: "active", label: "المفعّلة" },
  { value: "inactive", label: "المعطّلة" },
];

/* Arabic spellings drift — "فصايل" for "فصائل", "اسال" for "اسأل" — so both
   sides are folded to one form before comparing. */
function fold(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ئى]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

const matches = (needle, ...values) =>
  values.some((value) => fold(value).includes(needle));

function ForbiddenState({ status }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
        <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink">
        {status === 401 ? "انتهت صلاحية جلستك" : "لا تملك صلاحية عرض الأقسام"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        {status === 401
          ? "سجّل الدخول مرة أخرى للمتابعة."
          : "تواصل مع المشرف العام لمنحك صلاحية العرض."}
      </p>
    </div>
  );
}

function SubCategoryRow({
  sub,
  canManage,
  canDelete,
  onDetails,
  onToggle,
  onDelete,
  toggleBusy,
  toggleLocked,
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
      <button
        type="button"
        onClick={() => onDetails(sub)}
        className="min-w-0 flex-1 basis-48 cursor-pointer text-start"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-ink hover:text-brand-700">
            {sub.nameAr || sub.nameEn || "—"}
          </span>
          <ActiveBadge active={sub.isActive} />
          {sub.isSystem && <SystemBadge />}
        </span>

        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
          {sub.nameEn && <span dir="ltr">{sub.nameEn}</span>}
          {sub.nameEn && <span aria-hidden="true">·</span>}
          <span className="tnum">#{formatNumber(sub.id)}</span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        {canManage && (
          <Switch
            checked={Boolean(sub.isActive)}
            busy={toggleBusy}
            disabled={toggleLocked}
            onChange={(next) => onToggle(sub, next)}
            label={`${sub.isActive ? "تعطيل" : "تفعيل"} ${sub.nameAr}`}
          />
        )}

        <button
          type="button"
          onClick={() => onDetails(sub)}
          title="التفاصيل"
          aria-label={`تفاصيل ${sub.nameAr}`}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-brand-600 transition-colors hover:bg-brand-50"
        >
          <Eye size={17} />
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(sub)}
            title="حذف"
            aria-label={`حذف ${sub.nameAr}`}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
    </li>
  );
}

function CategoryCard({ category, subCategories, open, onToggleOpen, rowProps }) {
  const panelId = `category-${category.id}-subs`;

  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-start transition-colors hover:bg-canvas sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold text-ink">
              {category.nameAr || category.nameEn}
            </span>
            <ActiveBadge active={category.isActive} />
            {category.isSystem && <SystemBadge />}
          </span>

          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            {category.nameEn && <span dir="ltr">{category.nameEn}</span>}
            {category.nameEn && <span aria-hidden="true">·</span>}
            <span className="tnum">
              {formatNumber(category.subCategoriesCount ?? category.subCategories?.length ?? 0)} قسم فرعي
            </span>
            {typeof category.adsCount === "number" && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tnum">{formatNumber(category.adsCount)} إعلان</span>
              </>
            )}
          </span>
        </span>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul id={panelId} className="divide-y divide-line border-t border-line">
          {subCategories.length === 0 ? (
            <li className="px-5 py-4 text-[13px] text-muted">
              لا توجد أقسام فرعية مطابقة.
            </li>
          ) : (
            subCategories.map((sub) => (
              <SubCategoryRow
                key={sub.id}
                sub={sub}
                {...rowProps}
                toggleBusy={rowProps.pendingToggleId === sub.id}
              />
            ))
          )}
        </ul>
      )}
    </li>
  );
}

export default function AdminCategoriesPage() {
  const { canOnRoute } = useAdminAccess();

  const canView = canOnRoute(ROUTE, "View");

  const canManage = canOnRoute(ROUTE, "Manage");

  const canDelete = canOnRoute(ROUTE, "Delete");

  const { categoriesQuery, categories } = useAdminCategories({ enabled: canView });

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [expanded, setExpanded] = useState(() => new Set());

  // Only the id travels: the dialog reads the record from the server.
  const [selected, setSelected] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);

  const toggle = useToggleSubCategoryStatus();

  const deleteSub = useDeleteSubCategory({
    onDone: (_response, id) => {
      setPendingDelete(null);

      setSelected((current) => (current?.id === id ? null : current));
    },
  });

  const needle = fold(search);

  const isFiltering = needle !== "" || statusFilter !== "all";

  const visible = useMemo(() => {
    const statusOk = (sub) =>
      statusFilter === "all" ||
      (statusFilter === "active" ? sub.isActive : !sub.isActive);

    return categories
      .map((category) => {
        const subs = category.subCategories ?? [];

        const categoryHit =
          needle !== "" && matches(needle, category.nameAr, category.nameEn);

        const subCategories = subs.filter(
          (sub) =>
            statusOk(sub) &&
            (needle === "" ||
              categoryHit ||
              matches(needle, sub.nameAr, sub.nameEn, String(sub.id)))
        );

        return { category, subCategories };
      })
      .filter(({ subCategories, category }) =>
        isFiltering
          ? subCategories.length > 0 ||
            (needle !== "" && statusFilter === "all" && matches(needle, category.nameAr, category.nameEn))
          : true
      );
  }, [categories, needle, statusFilter, isFiltering]);

  const totals = useMemo(() => {
    const subs = categories.flatMap((category) => category.subCategories ?? []);

    return {
      categories: categories.length,
      subs: subs.length,
      inactive: subs.filter((sub) => !sub.isActive).length,
    };
  }, [categories]);

  const status = categoriesQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  const toggleOpen = (id) =>
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });

  const onToggle = (sub, isActive) => {
    // One status change at a time: a second click waits for the first answer.
    if (toggle.mutation.isPending) return;

    toggle.submit({ id: sub.id, isActive });
  };

  const rowProps = {
    canManage,
    canDelete,
    onDetails: setSelected,
    onToggle,
    onDelete: setPendingDelete,
    pendingToggleId: toggle.pendingId,
    toggleLocked: toggle.mutation.isPending,
  };

  return (
    <>
      <Seo title="الأقسام | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1000px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <Layers size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                الأقسام
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {totals.categories
                  ? `${formatNumber(totals.categories)} قسم · ${formatNumber(totals.subs)} قسم فرعي${
                      totals.inactive ? ` · ${formatNumber(totals.inactive)} معطّل` : ""
                    }`
                  : "الأقسام الرئيسية وأقسامها الفرعية."}
              </p>
            </div>
          </div>

          {canView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => categoriesQuery.refetch()}
              loading={categoriesQuery.isFetching && !categoriesQuery.isLoading}
            >
              <RotateCw size={15} />
              تحديث
            </Button>
          )}
        </header>

        {!canView ? (
          <ForbiddenState status={403} />
        ) : categoriesQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : isAuthError ? (
          <ForbiddenState status={status} />
        ) : categoriesQuery.isError ? (
          <ErrorState
            title={status === 429 ? "عدد كبير من الطلبات" : "تعذّر تحميل الأقسام"}
            description={
              status === 429
                ? "تم تجاوز الحد المسموح به مؤقتًا. انتظر قليلًا ثم أعد المحاولة."
                : "حدث خطأ أثناء جلب الأقسام. تحقّق من الاتصال وحاول مرة أخرى."
            }
            onRetry={categoriesQuery.refetch}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="لا توجد أقسام"
            description="لم يُرجع الخادم أي أقسام بعد."
          />
        ) : (
          <>
            <section className="mb-5 rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-0 flex-1 basis-64">
                  <Search
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ابحث باسم القسم أو القسم الفرعي…"
                    aria-label="بحث في الأقسام"
                    className={`${inputClass()} ps-11`}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="تصفية حسب الحالة"
                  className={`${selectClass()} w-full sm:w-44`}
                >
                  {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {visible.length === 0 ? (
              <EmptyState
                icon={Search}
                title="لا توجد نتائج مطابقة"
                description="جرّب كلمة أخرى أو غيّر فلتر الحالة."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                  >
                    مسح البحث
                  </Button>
                }
              />
            ) : (
              <ul
                className={`space-y-3 transition-opacity duration-200 ${
                  categoriesQuery.isFetching ? "opacity-60" : ""
                }`}
              >
                {visible.map(({ category, subCategories }) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    subCategories={subCategories}
                    // A search opens every card it found something in.
                    open={isFiltering || expanded.has(category.id)}
                    onToggleOpen={() => toggleOpen(category.id)}
                    rowProps={rowProps}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <SubCategoryDetailsModal
        subCategory={selected}
        onClose={() => setSelected(null)}
        canManage={canManage}
        canDelete={canDelete}
        onToggle={onToggle}
        toggleBusy={toggle.mutation.isPending}
        onDelete={setPendingDelete}
      />

      {/* Nothing leaves the list until the server says it is gone: the row is
          removed only by re-reading it, so a 409 leaves it where it was. */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="حذف القسم الفرعي"
        description={
          pendingDelete
            ? `سيتم حذف «${pendingDelete.nameAr || pendingDelete.nameEn}» (رقم ${formatNumber(
                pendingDelete.id
              )}) من قسم «${pendingDelete.categoryNameAr ?? ""}» نهائيًا. إن كانت هناك بيانات مرتبطة به فقد يرفض الخادم الحذف.`
            : ""
        }
        confirmLabel="حذف نهائيًا"
        loading={deleteSub.mutation.isPending}
        onConfirm={() => {
          if (!deleteSub.mutation.isPending) deleteSub.submit(pendingDelete.id);
        }}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
