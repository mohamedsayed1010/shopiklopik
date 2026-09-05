import { useCallback, useMemo, useState } from "react";
import { RotateCw, ShieldCheck, Star } from "lucide-react";

import Seo from "../../../components/Seo";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Skeleton from "../../../components/ui/Skeleton";
import BackButton from "../../../components/ui/BackButton";
import AdminPagination from "../../../components/admin/AdminPagination";
import useUrlState, { urlPositiveInt } from "../../../hooks/useUrlState";
import useAdminAccess from "../../../hooks/admin/useAdminPermissions";
import {
  useAdminFeedback,
  useAdminFeedbackDetails,
  useDeleteAdminFeedback,
} from "../../../hooks/admin/useAdminFeedback";
import AdminFeedbackTable from "./components/AdminFeedbackTable";
import AdminFeedbackDetails from "./components/AdminFeedbackDetails";
import { formatNumber } from "../../../utils/format";

const ROUTE = "/admin/feedback";

const DELETE = "Delete";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Only what the screen actually controls: the page and its size. */
const URL_STATE = {
  page: { defaultValue: 1, parse: urlPositiveInt },
  pageSize: { defaultValue: 20, parse: urlPositiveInt },
};

function AuthState({ status }) {
  return (
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
          : "عرض التقييمات مخصّص لحسابات الإدارة المصرّح لها."}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>

          <Skeleton className="hidden h-3 w-24 shrink-0 md:block" />
        </div>
      ))}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const { canOnRoute } = useAdminAccess();

  const canDelete = canOnRoute(ROUTE, DELETE);

  const { values, setValues } = useUrlState(URL_STATE);

  const pageIndex = values.page;

  const pageSize = values.pageSize;

  const filters = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  const listQuery = useAdminFeedback({ filters });

  /** The rating whose sheet is open — the row, used to seed the read. */
  const [selected, setSelected] = useState(null);

  /** True while the delete confirmation is up, over the sheet. */
  const [pendingDelete, setPendingDelete] = useState(null);

  const detailsQuery = useAdminFeedbackDetails({
    id: selected?.id,
    seed: selected,
  });

  const remove = useDeleteAdminFeedback({
    onDone: () => {
      setPendingDelete(null);

      setSelected(null);
    },
  });

  const setPageIndex = useCallback(
    (value) => setValues({ page: value }),
    [setValues]
  );

  const setPageSize = useCallback(
    (value) => setValues({ pageSize: value, page: 1 }),
    [setValues]
  );

  const result = listQuery.data?.data;

  const items = result?.items ?? [];

  const status = listQuery.error?.response?.status;

  const isAuthError = status === 401 || status === 403;

  const errorCopy =
    status === 429
      ? {
          title: "عدد كبير من الطلبات",
          description:
            "تم تجاوز الحد المسموح مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
        }
      : status >= 500
      ? {
          title: "خطأ في الخادم",
          description: "تعذّر على الخادم إكمال الطلب. حاول مرة أخرى بعد قليل.",
        }
      : {
          title: "تعذّر تحميل التقييمات",
          description: "حدث خطأ أثناء جلب التقييمات. حاول مرة أخرى.",
        };

  /* The dialog acts on the freshest copy: the detail response once it has
     landed, the row until then — both carry `id`. */
  const target = detailsQuery.data?.data ?? selected;

  return (
    <>
      <Seo title="التقييمات | لوحة التحكم" robots="noindex, nofollow" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
        <BackButton />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
              <Star size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                التقييمات
              </h1>

              <p className="mt-0.5 text-[13px] text-muted">
                {typeof result?.totalCount === "number"
                  ? `${formatNumber(result.totalCount)} تقييم مسجّل.`
                  : "تقييمات المستخدمين على الإعلانات."}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => listQuery.refetch()}
            loading={listQuery.isFetching && !listQuery.isLoading}
          >
            <RotateCw size={15} />
            تحديث
          </Button>
        </header>

        <div>
          {listQuery.isLoading ? (
            <TableSkeleton />
          ) : isAuthError ? (
            <AuthState status={status} />
          ) : listQuery.isError ? (
            <ErrorState
              title={errorCopy.title}
              description={errorCopy.description}
              onRetry={listQuery.refetch}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Star}
              title="لا توجد تقييمات"
              description="لم يُسجَّل أي تقييم حتى الآن."
            />
          ) : (
            <div
              className={`transition-opacity duration-200 ${
                listQuery.isFetching ? "opacity-60" : ""
              }`}
            >
              <AdminFeedbackTable items={items} onOpen={setSelected} />

              <div className="mt-4">
                <AdminPagination
                  result={result}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  itemNoun="تقييم"
                  onPageChange={setPageIndex}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminFeedbackDetails
        /* Hidden rather than unmounted while the confirmation is up, so the
           sheet is still there behind it if the delete is cancelled. */
        open={Boolean(selected) && !pendingDelete}
        onClose={() => setSelected(null)}
        query={detailsQuery}
        canDelete={canDelete}
        onDelete={setPendingDelete}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="حذف التقييم"
        description={
          target
            ? `سيُحذف تقييم «${
                target.reviewer?.name || "مستخدم"
              }» نهائيًا. لا يمكن التراجع عن هذا الإجراء.`
            : ""
        }
        confirmLabel="حذف نهائيًا"
        tone="danger"
        loading={remove.mutation.isPending}
        onConfirm={() => remove.submit(pendingDelete.id)}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
