import { Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  CornerDownLeft,
  Flame,
  LayoutGrid,
  Loader2,
  Megaphone,
  RotateCw,
  SearchX,
} from "lucide-react";

import Image from "../ui/Image";
import { SearchResultsSkeleton } from "../ui/Skeleton";
import { highlight } from "../../utils/search";

export default function SearchSuggestions({
  isOpen,
  showSkeleton,
  query,
  isAdMode,
  adSearch,
  options,
  recentOptions,
  activeIndex,
  setActiveIndex,
  listRef,
  listId,
  pick,
  clear,
}) {
  const adCount = options.filter((option) => option.kind === "ad").length;

  const isSearching = isAdMode && adSearch.status === "loading";

  const searchFailed = isAdMode && adSearch.status === "error";

  const noAds = isAdMode && adSearch.status === "success" && adCount === 0;

  let body;

  if (isAdMode && adCount === 0 && (isSearching || adSearch.status === "idle")) {
    body = (
      <div>
        <p className="flex items-center gap-2 px-5 pt-4 text-[12.5px] font-semibold text-muted">
          <Loader2 size={14} className="animate-spin text-brand-500" />
          جارٍ البحث في الإعلانات…
        </p>

        <SearchResultsSkeleton count={4} />
      </div>
    );
  } else if (!isAdMode && showSkeleton) {
    body = <SearchResultsSkeleton />;
  } else if (!isAdMode && query && options.length === 0) {
    body = (
      <Notice
        icon={SearchX}
        title="لا يوجد قسم بهذا الاسم"
        text="اضغط «بحث» للبحث عن هذه الكلمة داخل الإعلانات."
      />
    );
  } else {
    body = (
      <div ref={listRef} className="max-h-[min(24rem,60dvh)] overflow-y-auto p-2">
        {searchFailed && adCount === 0 && (
          <Notice
            icon={AlertTriangle}
            tone="danger"
            title="تعذّر البحث في الإعلانات"
            text="تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى."
            action={<RetryButton onClick={adSearch.retry} />}
          />
        )}

        {noAds && (
          <Notice
            icon={SearchX}
            title={
              <>
                لا توجد إعلانات تطابق «<bdi>{query}</bdi>»
              </>
            }
            text="جرّب كلمة أخرى أو أقصر، أو تصفّح الأقسام."
          />
        )}

        {options.length > 0 && (
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

            {options.map((option, index) => {
              const previous = options[index - 1]?.kind;

              return (
                <Fragment key={option.id}>
                  {!query && option.kind === "popular" && previous !== "popular" && (
                    <SectionLabel icon={Flame}>الأقسام الأكثر تنوعاً</SectionLabel>
                  )}

                  {isAdMode && option.kind === "ad" && index === 0 && (
                    <SectionLabel icon={Megaphone}>إعلانات مطابقة</SectionLabel>
                  )}

                  {isAdMode && option.kind !== "ad" && (index === 0 || previous === "ad") && (
                    <SectionLabel icon={LayoutGrid}>أقسام مطابقة</SectionLabel>
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
              );
            })}
          </ul>
        )}

        {isAdMode && adCount > 0 && isSearching && (
          <p className="flex items-center justify-center gap-1.5 px-3 pb-1 pt-2.5 text-[11.5px] text-muted">
            <Loader2 size={12} className="animate-spin" />
            جارٍ البحث في بقية الأقسام…
          </p>
        )}

        {isAdMode && !isSearching && adSearch.failed > 0 && adCount > 0 && (
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 pb-1 pt-2.5 text-[11.5px] text-muted">
            تعذّر البحث في {adSearch.failed} من الأقسام، وقد تكون هناك نتائج أخرى.
            <RetryButton onClick={adSearch.retry} compact />
          </p>
        )}

        {!isAdMode && query && options.length > 0 && (
          <p className="flex items-center justify-center gap-1.5 border-t border-line/70 px-3 pb-1 pt-2.5 text-[11.5px] text-muted">
            <CornerDownLeft size={12} strokeWidth={2.2} />
            اضغط Enter للبحث في الإعلانات
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Results arrive a list at a time; a screen reader hears the outcome
          once, not every partial count. */}
      <p className="sr-only" aria-live="polite">
        {isAdMode && adSearch.status === "success"
          ? adCount > 0
            ? `${adCount} إعلان مطابق`
            : "لا توجد إعلانات مطابقة"
          : searchFailed
            ? "تعذّر البحث في الإعلانات"
            : ""}
      </p>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/70 text-start shadow-xl ring-1 ring-line/70"
          >
            {body}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Notice({ icon: Icon, title, text, action, tone = "neutral" }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span
          aria-hidden="true"
          className={`absolute inset-0 animate-breathe rounded-full blur-lg ${
            tone === "danger" ? "bg-red-100/70" : "bg-brand-100/70"
          }`}
        />

        <Icon
          size={26}
          strokeWidth={1.6}
          aria-hidden="true"
          className={`relative ${tone === "danger" ? "text-red-500" : "text-brand-500"}`}
        />
      </span>

      <p className="mt-4 text-[14.5px] font-bold text-ink">{title}</p>

      <p className="mt-1.5 max-w-xs text-[12.5px] leading-6 text-muted">{text}</p>

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function RetryButton({ onClick, compact = false }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg font-semibold text-brand-800 transition-colors duration-150 hover:bg-brand-50 ${
        compact ? "px-1.5 py-0.5 text-[11.5px]" : "border border-line px-3 py-1.5 text-[12.5px]"
      }`}
    >
      <RotateCw size={compact ? 11 : 13} strokeWidth={2.2} />
      إعادة المحاولة
    </button>
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
        {option.image ? (
          <Image
            src={option.image}
            ratio="aspect-square"
            className="w-11 shrink-0 rounded-xl"
          />
        ) : (
          <span
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center rounded-xl transition-colors duration-150 ${
              option.kind === "ad" ? "h-11 w-11" : "h-9 w-9"
            } ${
              isActive
                ? "bg-brand-900 text-gold-300"
                : "bg-brand-50 text-brand-500"
            }`}
          >
            <Icon size={16} strokeWidth={2} />
          </span>
        )}

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
