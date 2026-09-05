import { ChevronLeft, Star } from "lucide-react";

import Image from "../../../../components/ui/Image";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";
import { formatDate, formatNumber } from "../../../../utils/format";

const HEADERS = ["المُقيِّم", "العنصر", "التقييم", "التاريخ", ""];

/** `rating` as the server sent it, drawn as filled marks plus the number. */
function RatingMarks({ rating }) {
  const value = typeof rating === "number" ? rating : 0;

  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            size={13}
            className={
              index < value
                ? "fill-gold-300 text-gold-400"
                : "fill-transparent text-line-strong"
            }
          />
        ))}
      </span>

      <span className="tnum text-[12.5px] font-bold text-ink">
        {formatNumber(value)}
      </span>
    </span>
  );
}

function TargetCell({ target }) {
  const image = resolveMediaUrl(target?.imageUrl);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {image ? (
        <Image
          src={image}
          alt=""
          ratio=""
          className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-line"
          imgClassName="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-lg border border-dashed border-line-strong bg-canvas"
        />
      )}

      <div className="min-w-0">
        <p className="max-w-[220px] truncate text-[13px] font-semibold text-ink">
          {target?.title || "—"}
        </p>

        <p className="max-w-[220px] truncate text-[11.5px] text-muted">
          {[target?.typeNameAr || target?.typeName, target?.categoryName]
            .filter(Boolean)
            .join(" • ") || "—"}
        </p>
      </div>
    </div>
  );
}

export default function AdminFeedbackTable({ items, onOpen }) {
  return (
    <>
      {/* ---------- phones and tablets ---------- */}
      <ul className="space-y-3 lg:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="w-full cursor-pointer rounded-2xl border border-line bg-surface p-3.5 text-start shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <TargetCell target={item.target} />

                <RatingMarks rating={item.rating} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-[12px]">
                <div className="min-w-0">
                  <dt className="text-muted">المُقيِّم</dt>
                  <dd className="truncate font-medium text-ink-soft">
                    {item.reviewer?.name || "—"}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-muted">التاريخ</dt>
                  <dd className="tnum truncate font-medium text-ink-soft">
                    {formatDate(item.createdAt) || "—"}
                  </dd>
                </div>
              </dl>
            </button>
          </li>
        ))}
      </ul>

      {/* ---------- desktop ---------- */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full min-w-[820px] border-collapse text-start">
          <thead>
            <tr className="border-b border-line bg-canvas">
              {HEADERS.map((header, index) => (
                <th
                  key={header || `spacer-${index}`}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3 text-start text-[12px] font-bold uppercase tracking-wide text-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onOpen(item)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;

                  event.preventDefault();

                  onOpen(item);
                }}
                className="cursor-pointer transition-colors duration-150 hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none"
              >
                <td className="px-3 py-3">
                  <p className="max-w-[180px] truncate text-[13.5px] font-semibold text-ink">
                    {item.reviewer?.name || "—"}
                  </p>
                </td>

                <td className="px-3 py-3">
                  <TargetCell target={item.target} />
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <RatingMarks rating={item.rating} />
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <span className="tnum text-[12.5px] text-muted">
                    {formatDate(item.createdAt) || "—"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <ChevronLeft
                    size={16}
                    aria-hidden="true"
                    className="text-line-strong"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
