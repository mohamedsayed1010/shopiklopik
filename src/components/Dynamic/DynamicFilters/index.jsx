import { useId, useState } from "react";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";

import DynamicField from "./DynamicField";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import { hiddenFilterNames } from "../../../utils/filterPanel";

function fieldOptions(field, options) {
  if (Array.isArray(field?.options) && field.options.length) {
    return field.options;
  }

  return options[field?.optionsSource] ?? [];
}

function withExtraFields(fields, extras) {
  if (!extras.length) return fields;

  const result = [...fields];

  extras.forEach((extra) => {
    const anchor = extra.after
      ? result.findIndex((field) => field.name === extra.after)
      : -1;

    if (anchor === -1) {
      result.unshift(extra);
    } else {
      result.splice(anchor + 1, 0, extra);
    }
  });

  return result;
}

export default function DynamicFilterRenderer({
  config,
  options = {},
  optionsStatus = {},
  extraFields = [],
  filters = {},
  pinned = {},
  setFilter,
  onReset,
  className = "",
}) {
  const [open, setOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  const panelId = useId();

  const fields = config?.list?.queryParameters ?? [];

  const hidden = hiddenFilterNames(config);

  const visibleFields = withExtraFields(
    fields.filter(
      (field) =>
        !hidden.has(field.name) &&
        !Object.prototype.hasOwnProperty.call(pinned, field.name)
    ),
    extraFields
  );

  if (!visibleFields.length) return null;

  /* By parameter, not by control: two controls can share one parameter, and a
     filter set once is one active filter however many ways it can be set. */
  const activeCount = new Set(
    visibleFields
      .filter((field) => {
        const value = filters[field.name];

        return value !== undefined && value !== "" && value !== null;
      })
      .map((field) => field.name)
  ).size;

  const badge = activeCount > 0 && (
    <span className="tnum flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-900 px-1.5 text-xs font-bold text-white">
      {activeCount}
    </span>
  );

  /* `min-w-0` on every cell: a grid track is `auto` by default, so one long
     option label would widen its column and push the page into a horizontal
     scroll instead of wrapping inside the control. */
  const grid = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
      {visibleFields.map((field) => (
        <DynamicField
          key={field.key ?? field.name}
          field={field}
          value={filters[field.name]}
          options={fieldOptions(field, options)}
          status={optionsStatus[field.optionsSource]}
          onChange={(value) => setFilter(field.name, value)}
        />
      ))}
    </div>
  );

  const resetButton = activeCount > 0 && onReset && (
    <Button variant="ghost" onClick={onReset}>
      <X size={16} />
      مسح الفلاتر
    </Button>
  );

  return (
    <div className={className}>
      {/* Mobile trigger — unchanged: same button, same place, same sheet. */}
      <div className="flex items-center gap-3 lg:hidden">
        <Button
          variant="outline"
          onClick={() => setSheetOpen(true)}
          className="flex-1"
        >
          <SlidersHorizontal size={17} />
          الفلاتر
          {badge}
        </Button>

        {activeCount > 0 && onReset && (
          <Button variant="ghost" onClick={onReset}>
            <X size={16} />
            مسح
          </Button>
        )}
      </div>

      {/* Desktop trigger. The panel used to sit open here permanently, taking
          the top of every list page whether or not anybody was filtering; it
          now opens on request, from a button sized to be found. */}
      <div className="hidden flex-wrap items-center gap-3 lg:flex">
        <Button
          size="lg"
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="px-7"
        >
          <SlidersHorizontal size={19} strokeWidth={2.2} />
          الفلاتر
          {badge}
          <ChevronDown
            size={17}
            aria-hidden="true"
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </Button>

        {resetButton}
      </div>

      {/* Desktop panel */}
      <div
        id={panelId}
        className={`mt-4 rounded-3xl border border-line bg-surface p-6 shadow-xs ${
          open ? "hidden lg:block" : "hidden"
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2.5 text-sm font-bold text-ink">
            <span
              aria-hidden="true"
              className="h-4 w-1 rounded-full bg-gold-300"
            />
            <SlidersHorizontal size={16} className="text-brand-400" />
            تصفية النتائج
            {badge}
          </h2>

          {activeCount > 0 && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-900"
            >
              <X size={15} />
              مسح الفلاتر
            </button>
          )}
        </div>

        {grid}
      </div>

      {/* Mobile sheet */}
      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="تصفية النتائج"
        footer={
          <div className="flex gap-3">
            {onReset && (
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  onReset();
                  setSheetOpen(false);
                }}
              >
                مسح الكل
              </Button>
            )}

            <Button fullWidth onClick={() => setSheetOpen(false)}>
              عرض النتائج
            </Button>
          </div>
        }
      >
        {grid}
      </Modal>
    </div>
  );
}
