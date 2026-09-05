import { Link } from "react-router-dom";
import { ExternalLink, Package, Star, Trash2, UserRound } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import Image from "../../../../components/ui/Image";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";
import { formatDateTime, formatNumber } from "../../../../utils/format";

function Row({ label, value, dir, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>

      <dd
        dir={dir}
        className={`min-w-0 break-words text-end text-[13.5px] font-medium text-ink-soft ${
          mono ? "tnum" : ""
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="mt-5">
      <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-muted">
        {Icon && <Icon size={15} strokeWidth={2.1} aria-hidden="true" />}
        {title}
      </h3>

      {children}
    </section>
  );
}

export default function AdminFeedbackDetails({
  open,
  onClose,
  query,
  canDelete,
  onDelete,
}) {
  const item = query.data?.data;

  const target = item?.target;

  const image = resolveMediaUrl(target?.imageUrl);

  /* All three ids, or nothing — see the note beside the link below. */
  const listingPath =
    target?.categoryId && target?.subCategoryId && target?.id
      ? `/dynamic/${target.categoryId}/${target.subCategoryId}/${target.id}`
      : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تفاصيل التقييم"
      description={item?.reviewer?.name || undefined}
      size="md"
      footer={
        item &&
        canDelete && (
          <div className="flex justify-end">
            <Button size="sm" variant="danger-ghost" onClick={() => onDelete(item)}>
              <Trash2 size={15} />
              حذف التقييم
            </Button>
          </div>
        )
      }
    >
      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : query.isError ? (
        <ErrorState
          title="تعذّر تحميل التقييم"
          description="حدث خطأ أثناء جلب هذا التقييم. حاول مرة أخرى."
          onRetry={query.refetch}
        />
      ) : !item ? null : (
        <>
          {/* ---------------------------- rating ---------------------------- */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas p-4">
            <span className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={18}
                  className={
                    index < (item.rating ?? 0)
                      ? "fill-gold-300 text-gold-400"
                      : "fill-transparent text-line-strong"
                  }
                />
              ))}
            </span>

            <span className="tnum text-2xl font-extrabold text-ink">
              {formatNumber(item.rating ?? 0)}
            </span>
          </div>

          {/* --------------------------- reviewer --------------------------- */}
          <Section title="المُقيِّم" icon={UserRound}>
            <dl className="rounded-2xl border border-line bg-canvas px-3.5 py-1">
              <Row label="الاسم" value={item.reviewer?.name} />
              <Row label="معرّف الحساب" dir="ltr" value={item.reviewer?.id} />
            </dl>
          </Section>

          {/* ---------------------------- target ---------------------------- */}
          <Section title="العنصر المُقيَّم" icon={Package}>
            <div className="rounded-2xl border border-line bg-canvas p-3.5">
              <div className="flex items-start gap-3">
                {image && (
                  <Image
                    src={image}
                    alt=""
                    ratio=""
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line"
                    imgClassName="object-cover"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink">
                    {target?.title || "—"}
                  </p>

                  <p className="truncate text-[11.5px] text-muted">
                    {[
                      target?.typeNameAr || target?.typeName,
                      target?.categoryName,
                      target?.subCategoryName,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "—"}
                  </p>

                  {/* The server's own flag — a rating can outlive its listing. */}
                  {target?.isAvailable === false && (
                    <span className="mt-1.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-inset ring-slate-300">
                      العنصر لم يعد متاحًا
                    </span>
                  )}
                </div>
              </div>

              <dl className="mt-3 border-t border-line pt-1">
                <Row label="معرّف العنصر" dir="ltr" value={target?.id} />
              </dl>

              {listingPath && (
                <Link
                  to={listingPath}
                  className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-brand-600 hover:text-brand-800"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  فتح العنصر
                </Link>
              )}
            </div>
          </Section>

          {/* ----------------------------- dates ---------------------------- */}
          <Section title="التواريخ">
            <dl className="rounded-2xl border border-line bg-canvas px-3.5 py-1">
              <Row label="تاريخ التقييم" mono value={formatDateTime(item.createdAt)} />

              {item.updatedAt && (
                <Row label="آخر تعديل" mono value={formatDateTime(item.updatedAt)} />
              )}
            </dl>
          </Section>
        </>
      )}
    </Modal>
  );
}
