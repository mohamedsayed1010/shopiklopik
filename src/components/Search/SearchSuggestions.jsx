import { Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Clock, CornerDownLeft, Flame, SearchX } from "lucide-react";

import { SearchResultsSkeleton } from "../ui/Skeleton";
import { highlight } from "../../utils/search";

export default function SearchSuggestions({
  isOpen,
  showSkeleton,
  query,
  options,
  recentOptions,
  activeIndex,
  setActiveIndex,
  listRef,
  listId,
  pick,
  clear,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.99 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="glass absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/70 text-start shadow-xl ring-1 ring-line/70"
        >
          {showSkeleton ? (
            <SearchResultsSkeleton />
          ) : query && options.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="relative flex h-16 w-16 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-breathe rounded-full bg-brand-100/70 blur-lg"
                />

                <SearchX
                  size={26}
                  strokeWidth={1.6}
                  aria-hidden="true"
                  className="relative text-brand-500"
                />
              </span>

              <p className="mt-4 text-[14.5px] font-bold text-ink">
                لا يوجد قسم بهذا الاسم
              </p>

              <p className="mt-1.5 max-w-xs text-[12.5px] leading-6 text-muted">
                جرّب كلمة أقصر، أو تصفّح الأقسام من الصفحة الرئيسية.
              </p>
            </div>
          ) : (
            <div
              ref={listRef}
              className="max-h-[min(24rem,60dvh)] overflow-y-auto p-2"
            >
              <ul id={listId} role="listbox" aria-label="نتائج البحث">
                {!query && recentOptions.length > 0 && (
                  <SectionLabel
                    icon={Clock}
                    action={
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={clear}
                        className="cursor-pointer rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold text-muted transition-colors duration-150 hover:bg-brand-50 hover:text-brand-800"
                      >
                        مسح
                      </button>
                    }
                  >
                    عمليات بحث سابقة
                  </SectionLabel>
                )}

                {options.map((option, index) => (
                  <Fragment key={option.id}>
                    {!query &&
                      option.kind === "popular" &&
                      options[index - 1]?.kind !== "popular" && (
                        <SectionLabel icon={Flame}>
                          الأقسام الأكثر تنوعاً
                        </SectionLabel>
                      )}

                    <Row
                      option={option}
                      index={index}
                      activeIndex={activeIndex}
                      query={query}
                      onPick={pick}
                      onHover={setActiveIndex}
                    />
                  </Fragment>
                ))}
              </ul>

              {query && options.length > 0 && (
                <p className="flex items-center justify-center gap-1.5 border-t border-line/70 px-3 pb-1 pt-2.5 text-[11.5px] text-muted">
                  <CornerDownLeft size={12} strokeWidth={2.2} />
                  اضغط Enter للانتقال إلى القسم المحدد
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ option, index, activeIndex, query, onPick, onHover }) {
  const isActive = index === activeIndex;

  const Icon = option.icon;

  return (
    <li role="none">
      <button
        type="button"
        role="option"
        id={`${option.domId}`}
        aria-selected={isActive}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onPick(option)}
        onPointerMove={() => onHover(index)}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors duration-150 ${
          isActive ? "bg-brand-50" : "hover:bg-brand-50/60"
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 ${
            isActive
              ? "bg-brand-900 text-gold-300"
              : "bg-brand-50 text-brand-500"
          }`}
        >
          <Icon size={16} strokeWidth={2} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-ink">
            {highlight(option.label, query).map((segment, position) =>
              segment.match ? (
                <mark
                  key={position}
                  className="rounded-[3px] bg-gold-200/70 px-0.5 text-ink"
                >
                  {segment.text}
                </mark>
              ) : (
                <span key={position}>{segment.text}</span>
              )
            )}
          </span>

          {option.hint && (
            <span className="mt-0.5 block truncate text-[12px] text-muted">
              {option.hint}
            </span>
          )}
        </span>

        <ArrowLeft
          size={15}
          aria-hidden="true"
          className={`shrink-0 transition-[opacity,transform] duration-200 ${
            isActive
              ? "-translate-x-0.5 text-brand-500 opacity-100"
              : "text-line-strong opacity-0"
          }`}
        />
      </button>
    </li>
  );
}

/** A heading inside the listbox — presentational, so it is skipped by arrows. */
function SectionLabel({ icon: Icon, children, action }) {
  return (
    <li
      role="presentation"
      className="flex items-center justify-between gap-3 px-3 pb-1 pt-3 first:pt-1"
    >
      <span className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-muted">
        <Icon size={12} strokeWidth={2.4} />
        {children}
      </span>

      {action}
    </li>
  );
}

