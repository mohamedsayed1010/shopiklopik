import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

import useAdvertiserOptions from "../../../hooks/useAdvertiserOptions";
import { useUrlDraft } from "../../../hooks/useUrlState";
import Spinner from "../../ui/Spinner";
import { inputClass, labelClass, selectClass } from "../../ui/formStyles";

const SEARCH_DEBOUNCE_MS = 400;

/** How close to the bottom of the list the next page is asked for. */
const LOAD_MORE_THRESHOLD = 48;

/**
 * The advertiser filter: the same closed control as every other select in the
 * panel, whose list comes from the advertisers lookup of this sub-category.
 * Opening it shows the first page; typing narrows it on the server; scrolling
 * to the end loads the next page. The value is always the advertiser's id.
 */
export default function AdvertiserSelect({ field, value, onChange }) {
  const label = field.label ?? field.name;

  const placeholder = field.placeholder ?? `اختر ${label}`;

  const listId = useId();

  const rootRef = useRef(null);

  const triggerRef = useRef(null);

  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [draft, updateDraft] = useUrlDraft(search, setSearch, SEARCH_DEBOUNCE_MS);

  const [active, setActive] = useState(0);

  /* The name picked last, so the control still reads it once a search or a
     page change has taken that advertiser out of the loaded options. */
  const [picked, setPicked] = useState(null);

  const {
    options,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdvertiserOptions(field.categoryId, field.subCategoryId, { search });

  const current = value === undefined || value === null ? "" : String(value);

  const selectedLabel = current
    ? (options.find((option) => String(option.value) === current)?.label ??
      (picked?.value === current ? picked.label : current))
    : "";

  /* The empty row clears the filter, as the placeholder option of a native
     select does. It is left out while searching, where it matches nothing,
     and above an error or an empty list when there is nothing to clear. */
  const offersClear = !search && (Boolean(current) || (!isError && options.length > 0));

  const rows = offersClear
    ? [{ value: "", label: placeholder }, ...options]
    : options;

  const isSearching = draft.trim() !== search.trim();

  function close({ focusTrigger = false } = {}) {
    setOpen(false);

    updateDraft("");

    setSearch("");

    if (focusTrigger) triggerRef.current?.focus();
  }

  function openList() {
    setActive(0);

    setOpen(true);
  }

  function choose(option) {
    setPicked(
      option.value === ""
        ? null
        : { value: String(option.value), label: option.label }
    );

    onChange(option.value);

    close({ focusTrigger: true });
  }

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* Clicking anywhere else closes it, as a native select does. */
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) close();
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);
    // `close` only touches setters and refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* A new result set starts at its top — adjusted during render, as React
     documents for state that follows another. */
  const [activeFor, setActiveFor] = useState(search);

  if (activeFor !== search) {
    setActiveFor(search);

    setActive(0);
  }

  function loadMoreIfNearEnd(element) {
    if (!hasNextPage || isFetchingNextPage) return;

    const remaining =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remaining <= LOAD_MORE_THRESHOLD) fetchNextPage();
  }

  function onListKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActive((index) => Math.min(index + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();

      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();

      if (rows[active]) choose(rows[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();

      close({ focusTrigger: true });
    } else if (event.key === "Tab") {
      close();
    }
  }

  /* Keep the highlighted row in view while moving through it by keyboard,
     and reaching the last one loads the next page as scrolling does. */
  useEffect(() => {
    if (!open) return;

    document
      .getElementById(`${listId}-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  let status = null;

  if (isLoading || isSearching) {
    status = (
      <span className="flex items-center justify-center gap-2">
        <Spinner size="sm" className="text-brand-400" />
        جارٍ التحميل…
      </span>
    );
  } else if (isError) {
    status = (
      <span className="flex flex-col items-center gap-2">
        تعذّر تحميل المعلنين.
        <button
          type="button"
          onClick={() => refetch()}
          className="cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-900"
        >
          إعادة المحاولة
        </button>
      </span>
    );
  } else if (!options.length) {
    status = "لم يتم العثور على معلنين";
  }

  return (
    <div ref={rootRef}>
      <label className={labelClass} htmlFor={`${listId}-trigger`}>
        {label}
      </label>

      <div className="relative">
        <button
          ref={triggerRef}
          id={`${listId}-trigger`}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          disabled={field.disabled}
          onClick={() => (open ? close() : openList())}
          onKeyDown={(event) => {
            if (!open && ["ArrowDown", "ArrowUp"].includes(event.key)) {
              event.preventDefault();

              openList();
            }
          }}
          className={`${selectClass()} block text-start`}
        >
          <span className="block truncate">{selectedLabel || placeholder}</span>
        </button>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted transition-transform duration-200 end-4 ${
            open ? "rotate-180" : ""
          }`}
        />

        {open && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            <div className="relative border-b border-line p-2">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-5"
              />

              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-label={`ابحث عن ${label}`}
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  rows[active] ? `${listId}-${active}` : undefined
                }
                autoComplete="off"
                value={draft}
                placeholder={`ابحث عن ${label}…`}
                onChange={(event) => updateDraft(event.target.value)}
                onKeyDown={onListKeyDown}
                className={`${inputClass({ sized: false })} h-10 ps-9 text-sm`}
              />
            </div>

            <ul
              id={listId}
              role="listbox"
              aria-label={label}
              aria-busy={isLoading || isFetchingNextPage}
              onScroll={(event) => loadMoreIfNearEnd(event.currentTarget)}
              className="max-h-64 overflow-y-auto py-1"
            >
              {!isSearching &&
                !isLoading &&
                rows.map((option, index) => {
                  const isSelected = String(option.value) === current;

                  return (
                    <li
                      key={option.value === "" ? "__none" : option.value}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      onPointerEnter={() => setActive(index)}
                      onClick={() => choose(option)}
                      className={`flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-sm transition-colors duration-150 ${
                        index === active ? "bg-canvas" : ""
                      } ${
                        option.value === ""
                          ? "text-muted"
                          : "font-medium text-ink"
                      }`}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>

                      {isSelected && option.value !== "" && (
                        <Check
                          size={15}
                          strokeWidth={2.5}
                          aria-hidden="true"
                          className="shrink-0 text-brand-600"
                        />
                      )}
                    </li>
                  );
                })}

              {status && (
                <li
                  role="presentation"
                  className="px-3.5 py-4 text-center text-sm text-muted"
                >
                  {status}
                </li>
              )}

              {isFetchingNextPage && (
                <li
                  role="presentation"
                  className="flex justify-center px-3.5 py-2.5"
                >
                  <Spinner size="sm" className="text-brand-400" />
                </li>
              )}

              {/* A keyboard user cannot scroll-trigger the next page, so the
                  end of a page that has more after it says so and loads it. */}
              {hasNextPage && !isFetchingNextPage && !status && (
                <li role="presentation" className="px-2 pb-1">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    className="w-full cursor-pointer rounded-lg py-2 text-sm font-semibold text-brand-600 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-900"
                  >
                    عرض المزيد
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
