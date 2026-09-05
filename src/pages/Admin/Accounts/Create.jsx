import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
  Check,
  KeyRound,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import Seo from "../../../components/Seo";
import Button from "../../../components/ui/Button";
import Skeleton from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import BackButton from "../../../components/ui/BackButton";
import { inputClass, labelClass } from "../../../components/ui/formStyles";
import SettingsSection from "../Settings/components/SettingsSection";
import PagePermissionsPicker from "./components/PagePermissionsPicker";
import { useAdminPermissionPages } from "../../../hooks/admin/useAdminPermissions";
import { groupPages } from "../../../utils/adminPermissions";
import { adminAccountPages } from "../../../utils/adminAccountPages";
import {
  candidateItem,
  candidateItems,
  useAdminCandidate,
  useAdminCandidates,
  useCreateAdminAccount,
} from "../../../hooks/admin/useAdminAccounts";
import useUrlState, { urlText, useUrlDraft } from "../../../hooks/useUrlState";
import { initialsOf } from "./accountsConstants";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import { formatNumber } from "../../../utils/format";

const LIST_PATH = "/admin/accounts";

/** Enough rows to choose from without turning the picker into a second list. */
const CANDIDATE_LIMIT = 20;

const MIN_SEARCH = 2;

const URL_STATE = {
  q: { defaultValue: "", parse: urlText },
};

function CandidateRow({ candidate, selected, onSelect, disabled }) {
  const image = resolveMediaUrl(candidate.image);

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(candidate)}
        aria-pressed={selected}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition-colors duration-200 disabled:opacity-60 ${
          selected
            ? "border-brand-400 bg-brand-50/60 ring-1 ring-inset ring-brand-300"
            : "border-line bg-surface hover:border-line-strong hover:bg-canvas"
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-900 text-[13px] font-bold text-gold-300">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(candidate.name, candidate.userName)
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-ink">
            {candidate.name || candidate.userName || "—"}
          </span>

          <span dir="ltr" className="block truncate text-[11.5px] text-muted">
            {[candidate.userName && `@${candidate.userName}`, candidate.email]
              .filter(Boolean)
              .join(" · ") || "—"}
          </span>
        </span>

        {/* The server's own verdict on this row, shown rather than inferred. */}
        {candidate.isSuperAdmin ? (
          <span className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-800 ring-1 ring-inset ring-gold-300">
            مسؤول عام
          </span>
        ) : candidate.isAdmin ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-inset ring-slate-300">
            مسؤول بالفعل
          </span>
        ) : null}

        {selected && (
          <Check size={17} className="shrink-0 text-brand-600" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}

/** The chosen person, re-read from the server before anything is submitted. */
function SelectedCandidate({ query, onClear, disabled }) {
  if (query.isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-canvas p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2.5 h-3 w-56" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="تعذّر تأكيد المستخدم"
        description="حدث خطأ أثناء قراءة بيانات المستخدم المحدَّد. حاول مرة أخرى."
        onRetry={query.refetch}
      />
    );
  }

  const person = candidateItem(query.data);

  if (!person) return null;

  const image = resolveMediaUrl(person.image);

  const rows = [
    { icon: AtSign, label: "اسم المستخدم", value: person.userName, dir: "ltr" },
    { icon: Mail, label: "البريد الإلكتروني", value: person.email, dir: "ltr" },
    { icon: Phone, label: "رقم الهاتف", value: person.phone, dir: "ltr" },
  ];

  return (
    <div className="rounded-2xl border border-brand-300 bg-brand-50/50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-900 text-sm font-bold text-gold-300">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(person.name, person.userName)
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">
            {person.name || person.userName || "—"}
          </p>

          {/* The server's wording for this account's state, not a local map. */}
          {person.statusName && (
            <p className="mt-0.5 text-[11.5px] text-muted">{person.statusName}</p>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onClear}
        >
          <X size={15} />
          تغيير
        </Button>
      </div>

      <dl className="mt-3 border-t border-brand-200/70 pt-1">
        {rows.map(({ icon: Icon, label, value, dir }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 border-b border-brand-200/50 py-2 last:border-0"
          >
            <dt className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-muted">
              <Icon size={14} aria-hidden="true" />
              {label}
            </dt>

            <dd
              dir={dir}
              className="min-w-0 truncate text-[13px] font-medium text-ink-soft"
            >
              {value || "—"}
            </dd>
          </div>
        ))}
      </dl>

      {person.isAdmin && (
        <p className="mt-3 rounded-xl border border-gold-300 bg-gold-50 px-3 py-2 text-[12px] leading-6 text-gold-900">
          هذا الحساب مسؤول بالفعل. سيرفض الخادم إنشاء حساب إدارة مكرر.
        </p>
      )}
    </div>
  );
}

export default function AdminAccountCreatePage() {
  const navigate = useNavigate();

  /** The chosen user's id — the only thing creation actually needs. */
  const [userId, setUserId] = useState(null);

  const [selection, setSelection] = useState({});

  const { values, setValues } = useUrlState(URL_STATE);

  /* The committed term is what the query key uses; the box itself follows a
     draft, exactly as every other admin search on this console does. */
  const [search, setSearch] = useUrlDraft(values.q, (next) =>
    setValues({ q: next })
  );

  const term = values.q.trim();

  /* Below the server's own minimum there is nothing worth asking for. */
  const canSearch = term.length >= MIN_SEARCH;

  const params = useMemo(
    () => ({
      q: term,
      excludeAdmins: true,
      limit: CANDIDATE_LIMIT,
    }),
    [term]
  );

  const candidatesQuery = useAdminCandidates({
    params,
    enabled: canSearch,
  });

  const candidateQuery = useAdminCandidate({ userId });

  const { pages: catalogue, pagesQuery } = useAdminPermissionPages();

  /* The ten pages the admin-accounts screens manage — the rule is shared with
     the permissions editor and with the request bodies themselves, in
     `utils/adminAccountPages`. */
  const pages = useMemo(() => adminAccountPages(catalogue), [catalogue]);

  /* Rebuilt from the filtered list so a group left with no pages disappears
     rather than rendering an empty heading. */
  const groups = useMemo(() => groupPages(pages), [pages]);

  const { mutation, submit } = useCreateAdminAccount({
    onDone: () => navigate(LIST_PATH, { replace: true }),
  });

  const candidates = candidateItems(candidatesQuery.data);

  const totals = useMemo(() => {
    const granted = Object.values(selection).filter((set) => set && set.size > 0);

    return {
      pages: granted.length,
      permissions: granted.reduce((sum, set) => sum + set.size, 0),
    };
  }, [selection]);

  const status = candidatesQuery.error?.response?.status;

  const canSubmit = Boolean(userId) && !mutation.isPending;

  return (
    <>
      <Seo title="إضافة مسؤول | لوحة التحكم" robots="noindex, nofollow" />

      {/* `pb-40` clears the action bar, which is fixed over the page bottom. */}
      <div className="mx-auto max-w-[1000px] px-4 py-6 pb-40 sm:px-6 lg:px-8 lg:py-10">
        <BackButton />

        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-gold-300 shadow-sm">
            <UserPlus size={21} strokeWidth={2} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              إضافة مسؤول جديد
            </h1>

            <p className="mt-0.5 text-[13px] text-muted">
              اختر مستخدمًا مسجَّلًا وحدِّد الصفحات التي يديرها.
            </p>
          </div>
        </header>

        <div className="space-y-5">
          <SettingsSection
            icon={UserRound}
            title="المستخدم"
            description="ابحث عن حساب مسجَّل لمنحه صلاحيات الإدارة."
          >
            {userId ? (
              <SelectedCandidate
                query={candidateQuery}
                disabled={mutation.isPending}
                onClear={() => setUserId(null)}
              />
            ) : (
              <>
                <label htmlFor="admin-candidate-search" className={labelClass}>
                  بحث عن مستخدم
                </label>

                <div className="relative">
                  <Search
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-4"
                  />

                  <input
                    id="admin-candidate-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="الاسم، اسم المستخدم، البريد أو الهاتف…"
                    className={`${inputClass()} ps-11`}
                  />
                </div>

                <div className="mt-4">
                  {!canSearch ? (
                    <EmptyState
                      icon={Search}
                      title="ابحث عن مستخدم"
                      description={`اكتب ${formatNumber(MIN_SEARCH)} أحرف على الأقل للبحث عن حساب مسجَّل.`}
                    />
                  ) : candidatesQuery.isLoading ? (
                    <ul className="space-y-2.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
                        >
                          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

                          <div className="min-w-0 flex-1">
                            <Skeleton className="h-3.5 w-1/3" />
                            <Skeleton className="mt-2 h-3 w-1/2" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : status === 401 || status === 403 ? (
                    <EmptyState
                      icon={ShieldCheck}
                      title="لا تملك صلاحية الوصول"
                      description="إدارة حسابات المسؤولين مخصّصة للمسؤول العام."
                    />
                  ) : candidatesQuery.isError ? (
                    <ErrorState
                      title="تعذّر تحميل المستخدمين"
                      description="حدث خطأ أثناء جلب المستخدمين. حاول مرة أخرى."
                      onRetry={candidatesQuery.refetch}
                    />
                  ) : candidates.length === 0 ? (
                    <EmptyState
                      icon={UserRound}
                      title="لا توجد نتائج"
                      description="لم يُعثر على مستخدم مطابق لهذا البحث."
                    />
                  ) : (
                    <ul
                      className={`space-y-2.5 transition-opacity duration-200 ${
                        candidatesQuery.isFetching ? "opacity-60" : ""
                      }`}
                    >
                      {candidates.map((candidate) => (
                        <CandidateRow
                          key={candidate.userId}
                          candidate={candidate}
                          selected={candidate.userId === userId}
                          disabled={mutation.isPending}
                          onSelect={(next) => setUserId(next.userId)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </SettingsSection>

          <SettingsSection
            icon={KeyRound}
            title="الصفحات والصلاحيات"
            description="اختر الصفحات التي يصل إليها هذا المسؤول والصلاحيات على كل صفحة."
            action={
              totals.pages > 0 ? (
                <span className="tnum rounded-full bg-brand-900 px-2.5 py-1 text-[11.5px] font-bold text-white">
                  {formatNumber(totals.pages)} / {formatNumber(pages.length)}
                </span>
              ) : null
            }
          >
            {totals.pages === 0 && !pagesQuery.isLoading && !pagesQuery.isError && (
              <p className="mb-4 flex items-start gap-2 rounded-2xl border border-dashed border-line-strong bg-canvas p-3.5 text-[12.5px] leading-6 text-muted">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                لن يصل هذا الحساب إلى أي صفحة إذا تُرك هذا القسم فارغًا.
              </p>
            )}

            {/* The same picker the permissions editor uses, with its toolbar
                scrolling as part of the page rather than pinned to a modal. */}
            <PagePermissionsPicker
              pages={pages}
              groups={groups}
              selection={selection}
              onChange={setSelection}
              disabled={mutation.isPending}
              query={pagesQuery}
              stickyToolbar={false}
            />
          </SettingsSection>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 px-4 pb-3 safe-bottom lg:bottom-0 lg:pb-5">
        <div className="pointer-events-auto mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-strong bg-surface/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="tnum flex items-center gap-2 text-[13px] font-medium text-ink-soft">
            <ShieldCheck size={16} aria-hidden="true" className="text-brand-400" />
            {formatNumber(totals.pages)} صفحة · {formatNumber(totals.permissions)}{" "}
            صلاحية
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => navigate(LIST_PATH)}
            >
              إلغاء
            </Button>

            <Button
              type="button"
              size="sm"
              loading={mutation.isPending}
              disabled={!canSubmit}
              onClick={() => submit({ userId, pages: selection })}
            >
              <UserPlus size={15} />
              منح الصلاحيات
            </Button>
          </div>
        </div>

        {!userId && (
          <p className="pointer-events-auto mx-auto mt-2 max-w-[1000px] text-center text-[12px] font-medium text-muted">
            اختر مستخدمًا أولًا
          </p>
        )}
      </div>
    </>
  );
}
