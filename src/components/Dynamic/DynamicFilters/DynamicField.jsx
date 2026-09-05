import { ChevronDown, Check } from "lucide-react";

import {
  labelClass,
  hintClass,
  inputClass,
  selectClass,
} from "../../ui/formStyles";

/** Config types whose value travels as a number. */
const NUMERIC_TYPES = ["int", "decimal", "double", "float"];

function FieldLabel({ text, required }) {
  return (
    <label className={labelClass}>
      {text}

      {required && <span className="ms-1 text-red-600">*</span>}
    </label>
  );
}

export default function DynamicField({
  field,
  value,
  options = [],
  status = {},
  onChange,
}) {
  const label = field.label ?? field.labelEn ?? field.name;

  const optionValueKey = field.optionsValue || "id";

  const optionLabelKey = field.optionsLabel || "label";

  function getOptionValue(option) {
    return (
      option?.[optionValueKey] ??
      option?.value ??
      option?.id ??
      option?.code ??
      option?.name
    );
  }

  function getOptionLabel(option) {
    return (
      option?.[optionLabelKey] ??
      option?.label ??
      option?.name ??
      option?.title ??
      option?.text
    );
  }

  const labelNode = <FieldLabel text={label} required={field.required} />;

  const waitingForOptions =
    Boolean(field.optionsSource) &&
    status?.isLoading === true &&
    !options.length;

  const isChoice =
    !field.multiple &&
    (field.type === "enum" || options.length > 0 || waitingForOptions);

  /* The value the API expects: an int parameter stays an int, so a filter
     reads the same whether it was typed or picked. Enum values are sent as the
     config publishes them. */
  const toValue = (raw) => {
    if (raw === "") return "";

    return NUMERIC_TYPES.includes(field.type) ? Number(raw) : raw;
  };

  /* "اختر" is an instruction to pick from a list, so it belongs to a dropdown
     and nowhere else — a box you type into asks you to search. A field already
     called "بحث" would read "ابحث عن بحث", so it just asks. */
  const searchPlaceholder = label.includes("بحث") ? "ابحث" : `ابحث عن ${label}`;

  const choicePlaceholder = waitingForOptions
    ? "جارٍ التحميل…"
    : `اختر ${label}`;

  const placeholder =
    field.placeholder ?? (isChoice ? choicePlaceholder : searchPlaceholder);

  /* A field the config marks `multiple` — المميزات — is a list of choices, and
     its type is the type of *one* of them. Reading the type alone rendered it
     as a number box asking for raw feature ids. */
  if (field.multiple && (options.length > 0 || waitingForOptions)) {
    const selected = (Array.isArray(value) ? value : []).map(String);

    return (
      <div>
        {labelNode}

        <select
          multiple
          size={5}
          className={`${inputClass({ sized: false })} cursor-pointer py-2`}
          value={selected}
          disabled={field.disabled || waitingForOptions}
          onChange={(event) =>
            onChange(
              [...event.target.selectedOptions].map((option) =>
                toValue(option.value)
              )
            )
          }
        >
          {options.map((option) => (
            <option key={getOptionValue(option)} value={getOptionValue(option)}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>

        <p className={hintClass}>
          {waitingForOptions ? "جارٍ التحميل…" : "يمكن اختيار أكثر من عنصر"}
        </p>
      </div>
    );
  }

  if (isChoice) {
    const current = value ?? field.defaultValue ?? "";

    const matches = (candidate) =>
      options.some(
        (option) => String(getOptionValue(option)) === String(candidate)
      );

    const selectValue = matches(current) ? current : "";

    /* A field the config defaults — الترتيب defaults to "الأحدث" — opens on
       that option, so an empty first entry would offer a choice that means
       nothing: picking it lands back on the same default. */
    const hasDefault =
      field.defaultValue !== undefined &&
      field.defaultValue !== null &&
      field.defaultValue !== "" &&
      matches(field.defaultValue);

    return (
      <div>
        {labelNode}

        <div className="relative">
          <select
            className={selectClass()}
            value={selectValue}
            disabled={field.disabled || waitingForOptions}
            onChange={(event) => onChange(toValue(event.target.value))}
          >
            {!hasDefault && <option value="">{placeholder}</option>}

            {options.map((option) => (
              <option
                key={getOptionValue(option)}
                value={getOptionValue(option)}
              >
                {getOptionLabel(option)}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
          />
        </div>
      </div>
    );
  }

  switch (field.type) {
    case "string":
      return (
        <div>
          {labelNode}

          <input
            type="text"
            className={inputClass()}
            value={value ?? field.defaultValue ?? ""}
            placeholder={placeholder}
            readOnly={field.readOnly}
            disabled={field.disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      );

    case "int":
    case "decimal":
    case "double":
    case "float":
      return (
        <div>
          {labelNode}

          <input
            type="number"
            inputMode="numeric"
            className={`${inputClass()} tnum`}
            value={value ?? field.defaultValue ?? ""}
            placeholder={placeholder}
            min={field.minValue}
            max={field.maxValue}
            step={field.type === "int" ? 1 : "any"}
            readOnly={field.readOnly}
            disabled={field.disabled}
            onChange={(event) =>
              onChange(
                event.target.value === "" ? "" : Number(event.target.value)
              )
            }
          />
        </div>
      );

    case "bool":
    case "boolean":
      return (
        <label className="flex h-12 cursor-pointer items-center gap-3 self-end rounded-xl border border-line-strong bg-surface px-4 transition-colors hover:border-brand-300">
          <input
            type="checkbox"
            className="sr-only"
            checked={Boolean(value ?? field.defaultValue ?? false)}
            disabled={field.disabled}
            onChange={(event) => onChange(event.target.checked)}
          />

          <span
            aria-hidden="true"
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
              value
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-line-strong bg-surface"
            }`}
          >
            {value && <Check size={13} strokeWidth={3} />}
          </span>

          <span className="text-sm font-medium text-ink">{label}</span>
        </label>
      );

    case "date":
      return (
        <div>
          {labelNode}

          <input
            type="date"
            className={inputClass()}
            value={value ?? field.defaultValue ?? ""}
            min={field.minValue}
            max={field.maxValue}
            disabled={field.disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      );

    default:
      return null;
  }
}
