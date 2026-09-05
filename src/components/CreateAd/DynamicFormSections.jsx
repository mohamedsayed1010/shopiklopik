import FieldRenderer from "./FieldRenderer";

/** Controls that need the full row to breathe. */
const WIDE_TYPES = [
  "textarea",
  "image",
  "file",
  "video",
  "audio",
  "pdf",
  "divider",
  "label",
  "multiselect",
  "radio",
  "switch",
  "checkbox",
  "range",
];

export default function DynamicFormSections({
  sections = [],
  values = {},
  errors = {},
  lookups,
  requiredFor,
  onChange,
  onBlur,
}) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        if (section.fields.length === 0) return null;

        return (
          <section
            key={section.title}
            className="rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6"
          >
            {section.title && (
              <h2 className="mb-5 border-b border-line pb-4 text-base font-semibold text-ink">
                {section.title}
              </h2>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {section.fields.map((field) => (
                <div
                  key={field.name}
                  /* The submit handler scrolls to the first invalid field by
                     this attribute, so it belongs on the wrapper both forms
                     render. */
                  data-field={field.name}
                  className={WIDE_TYPES.includes(field.type) ? "md:col-span-2" : ""}
                >
                  <FieldRenderer
                    field={field}
                    value={values[field.name]}
                    error={errors[field.name]}
                    required={requiredFor(field)}
                    lookups={lookups}
                    onChange={onChange}
                    onBlur={onBlur}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
