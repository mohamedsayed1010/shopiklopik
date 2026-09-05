import { useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, X, Check, ChevronDown } from "lucide-react";

import { LOCATION_TYPE, resolveOptions } from "../../utils/dynamicForm";
import LocationPicker from "./LocationPicker";
import {
  labelClass,
  hintClass,
  errorClass,
  inputClass,
  selectClass,
  inputBase,
  inputIdle,
  inputInvalid,
} from "../ui/formStyles";

const TEXT_TYPES = ["text", "email", "password", "tel", "url", "search"];

const FILE_TYPES = ["image", "file", "video", "audio", "pdf"];

const ACCEPT_BY_TYPE = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  pdf: "application/pdf",
};

/** Types that own their label (or have none at all). */
const NO_LABEL_TYPES = ["checkbox", "switch", "hidden", "divider", "label"];

export default function FieldRenderer({
  field,
  value,
  error,
  required = false,
  lookups,
  onChange,
  onBlur,
}) {
  const [previews, setPreviews] = useState([]);

  // Object URLs are created for previews only — release them on unmount.
  const previewsRef = useRef([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const options = useMemo(
    () => resolveOptions(field, lookups),
    [field, lookups]
  );

  const invalid = Boolean(error);

  const updateValue = (next) => onChange?.(field.name, next);

  const handleBlur = () => onBlur?.(field.name);

  const handleInputChange = (event) => {
    const next = event.target.value;

    if (field.type === "number" || field.type === "range") {
      updateValue(next === "" ? "" : Number(next));
      return;
    }

    updateValue(next);
  };

  const handleSelect = (event) => {
    const next = event.target.value;

    // Submit the option's own value (id or string), never the visible label.
    const option = options.find((item) => String(item.value) === String(next));

    updateValue(next === "" ? "" : (option?.value ?? next));
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) return;

    if (field.multiple) {
      const existing = Array.isArray(value) ? value : [];

      updateValue([...existing, ...files]);

      if (field.type === "image") {
        setPreviews((prev) => [
          ...prev,
          ...files.map((file) => URL.createObjectURL(file)),
        ]);
      }
    } else {
      updateValue(files[0]);

      if (field.type === "image") {
        previews.forEach((url) => URL.revokeObjectURL(url));
        setPreviews([URL.createObjectURL(files[0])]);
      }
    }

    // Allow re-selecting the same file after a removal.
    event.target.value = "";
  };

  const removeFile = (index) => {
    setPreviews((prev) => {
      const url = prev[index];

      if (url) URL.revokeObjectURL(url);

      return prev.filter((_, i) => i !== index);
    });

    if (field.multiple) {
      updateValue((Array.isArray(value) ? value : []).filter((_, i) => i !== index));
    } else {
      updateValue(field.type === "image" ? [] : "");
    }
  };

  const isRequired = required;

  /* ------------------------------------------------------------------ */
  /* Structural types                                                    */
  /* ------------------------------------------------------------------ */

  if (field.type === "hidden") {
    return <input type="hidden" value={value ?? ""} readOnly />;
  }

  if (field.type === "divider") {
    return <hr className="my-2 border-line" />;
  }

  if (field.type === "label") {
    return (
      <p className="rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm font-medium leading-6 text-gold-700">
        {field.text}
      </p>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Control                                                             */
  /* ------------------------------------------------------------------ */

  const control = (() => {
    if (TEXT_TYPES.includes(field.type)) {
      return (
        <input
          type={field.type}
          value={value ?? ""}
          readOnly={field.readOnly}
          disabled={field.disabled}
          required={isRequired}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
          pattern={field.pattern}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={inputClass({ invalid })}
        />
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          min={field.minValue}
          max={field.maxValue}
          required={isRequired}
          disabled={field.disabled}
          readOnly={field.readOnly}
          placeholder={field.placeholder}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={`${inputClass({ invalid })} tnum`}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          value={value ?? ""}
          rows={field.rows ?? 5}
          required={isRequired}
          disabled={field.disabled}
          readOnly={field.readOnly}
          placeholder={field.placeholder}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={`${inputBase} ${
            invalid ? inputInvalid : inputIdle
          } min-h-32 resize-y py-3 leading-7`}
        />
      );
    }

    if (field.type === "select") {
      return (
        <div className="relative">
          <select
            value={value ?? ""}
            disabled={field.disabled || field.readOnly}
            required={isRequired}
            onChange={handleSelect}
            onBlur={handleBlur}
            className={selectClass({ invalid })}
          >
            <option value="">اختر {field.label}</option>

            {options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
          />
        </div>
      );
    }

    if (field.type === "multiselect") {
      const selected = Array.isArray(value) ? value : [];

      const toggle = (optionValue) => {
        const key = String(optionValue);

        /* Derived from the latest value rather than the one captured at render
           time, so two toggles in the same tick cannot drop a selection. */
        updateValue((current) => {
          const list = Array.isArray(current) ? current : [];

          return list.some((item) => String(item) === key)
            ? list.filter((item) => String(item) !== key)
            : [...list, optionValue];
        });
      };

      return (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isActive = selected.some(
              (item) => String(item) === String(option.value)
            );

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => toggle(option.value)}
                aria-pressed={isActive}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-brand-900 bg-brand-900 text-white"
                    : "border-line-strong bg-surface text-ink-soft hover:border-brand-300"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      );
    }

    if (field.type === "radio") {
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isActive = String(value) === String(option.value);

            return (
              <label
                key={String(option.value)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-brand-900 bg-brand-50 text-brand-900"
                    : "border-line-strong bg-surface text-ink-soft hover:border-brand-300"
                }`}
              >
                <input
                  hidden
                  type="radio"
                  name={field.name}
                  checked={isActive}
                  onChange={() => updateValue(option.value)}
                />

                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    isActive ? "border-brand-900" : "border-line-strong"
                  }`}
                >
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-brand-900" />
                  )}
                </span>

                {option.label}
              </label>
            );
          })}
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-surface p-4 transition-colors hover:border-brand-300">
          <input
            type="checkbox"
            className="sr-only"
            checked={Boolean(value)}
            onChange={(event) => updateValue(event.target.checked)}
          />

          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              value
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-line-strong"
            }`}
          >
            {value && <Check size={13} strokeWidth={3} />}
          </span>

          <span className="text-sm font-medium leading-6 text-ink">
            {field.checkboxLabel ?? field.label}
          </span>
        </label>
      );
    }

    if (field.type === "switch") {
      return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line-strong bg-surface p-4">
          <span className="text-sm font-medium text-ink">{field.label}</span>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            onClick={() => updateValue(!value)}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              value ? "bg-brand-900" : "bg-line-strong"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                value ? "start-6" : "start-1"
              }`}
            />
          </button>
        </div>
      );
    }

    if (["date", "time", "datetime-local", "month", "week"].includes(field.type)) {
      return (
        <input
          type={field.type}
          value={value ?? ""}
          min={field.minValue}
          max={field.maxValue}
          required={isRequired}
          disabled={field.disabled}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={inputClass({ invalid })}
        />
      );
    }

    if (field.type === "color") {
      return (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value ?? "#041B3D"}
            onChange={handleInputChange}
            className="h-12 w-16 cursor-pointer rounded-xl border border-line-strong bg-surface p-1"
          />

          <span className="tnum rounded-lg bg-canvas px-3 py-2 text-sm text-muted">
            {value || "#041B3D"}
          </span>
        </div>
      );
    }

    if (field.type === "range") {
      return (
        <div>
          <input
            type="range"
            min={field.minValue ?? 0}
            max={field.maxValue ?? 100}
            value={value ?? field.minValue ?? 0}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-full cursor-pointer accent-brand-900"
          />

          <p className="tnum mt-2 text-center text-sm font-semibold text-ink">
            {value ?? field.minValue ?? 0}
          </p>
        </div>
      );
    }

    if (field.type === LOCATION_TYPE) {
      return (
        <LocationPicker
          value={value}
          invalid={invalid}
          /* The picker shows the config's help text itself, next to the state
             it describes, so the generic hint below is suppressed for it. */
          helpText={field.helpText}
          onChange={updateValue}
          onBlur={handleBlur}
        />
      );
    }

    if (FILE_TYPES.includes(field.type)) {
      const fileCount = Array.isArray(value) ? value.length : value ? 1 : 0;

      /* The backend publishes the permitted extensions per field; the old
         `field.accept` is a key it never sends, so the picker was unfiltered. */
      const acceptAttribute = field.allowedExtensions?.length
        ? field.allowedExtensions
            .map((item) => `.${String(item).replace(/^\./, "")}`)
            .join(",")
        : (ACCEPT_BY_TYPE[field.type] ?? undefined);

      return (
        <div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-strong bg-canvas px-6 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
            <UploadCloud
              size={28}
              strokeWidth={1.6}
              className="mb-3 text-brand-400"
            />

            <span className="text-sm font-semibold text-ink">
              {field.uploadText ?? `اضغط لاختيار ${field.label}`}
            </span>

            <span className="mt-1.5 text-xs text-muted">
              {field.multiple
                ? "يمكنك اختيار أكثر من ملف"
                : "ملف واحد فقط"}
            </span>

            <input
              hidden
              type="file"
              multiple={field.multiple}
              accept={acceptAttribute}
              onChange={handleFiles}
              onBlur={handleBlur}
            />
          </label>

          {/* Image previews */}
          {field.type === "image" && previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {previews.map((url, index) => (
                <div
                  key={url}
                  className="group relative overflow-hidden rounded-xl border border-line"
                >
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label="حذف الصورة"
                    className="absolute top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-950/70 text-white transition-colors hover:bg-red-600 end-1.5"
                  >
                    <X size={14} />
                  </button>

                  {index === 0 && (
                    <span className="absolute bottom-1.5 rounded-md bg-brand-950/70 px-1.5 py-0.5 text-[10px] font-medium text-white start-1.5">
                      الصورة الرئيسية
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Non-image file summary */}
          {field.type !== "image" && fileCount > 0 && (
            <p className="mt-3 text-sm text-muted">
              تم اختيار <span className="tnum font-semibold">{fileCount}</span>{" "}
              ملف
            </p>
          )}
        </div>
      );
    }

    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        نوع حقل غير مدعوم:{" "}
        <span className="font-semibold">{field.type}</span>
      </p>
    );
  })();

  const showLabel = !NO_LABEL_TYPES.includes(field.type);

  return (
    <div>
      {showLabel && (
        <label className={`${labelClass} flex items-center gap-2`}>
          <span>{field.label}</span>

          {isRequired ? (
            <span className="text-red-600" aria-label="مطلوب">
              *
            </span>
          ) : (
            <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-normal text-muted">
              اختياري
            </span>
          )}
        </label>
      )}

      {control}

      {/* Validation has to be visible to be useful; this reuses the error style
          the design system already defines rather than introducing one. */}
      {error && <p className={errorClass}>{error}</p>}

      {/* The location picker renders the help text inside itself, beside the
          "تم تحديد الموقع" state it explains. */}
      {field.helpText && field.type !== LOCATION_TYPE && (
        <p className={hintClass}>{field.helpText}</p>
      )}

      {field.patternMessage && (
        <p className={hintClass}>{field.patternMessage}</p>
      )}
    </div>
  );
}
