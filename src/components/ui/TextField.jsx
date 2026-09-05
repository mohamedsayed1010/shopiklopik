import { useState } from "react";
import { Eye, EyeOff, ChevronDown, AlertCircle } from "lucide-react";

import {
  labelClass,
  errorClass,
  hintClass,
  inputClass,
  selectClass,
} from "./formStyles";

/** Errors are announced, not just coloured — colour alone is not a message. */
function FieldError({ id, children }) {
  return (
    <p id={id} role="alert" className={errorClass}>
      <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Label row that can carry a secondary action (e.g. "forgot password?"). */
function FieldLabel({ htmlFor, children, action }) {
  if (!action) {
    return (
      <label htmlFor={htmlFor} className={labelClass}>
        {children}
      </label>
    );
  }

  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {children}
      </label>

      {action}
    </div>
  );
}

export function TextField({
  formik,
  name,
  label,
  type = "text",
  icon: Icon,
  placeholder,
  autoComplete,
  readOnly = false,
  dir,
  labelAction,
  className = "",
}) {
  const [reveal, setReveal] = useState(false);

  const isPassword = type === "password";

  const invalid = Boolean(formik.touched[name] && formik.errors[name]);

  const errorId = `${name}-error`;

  return (
    <div className={className}>
      <FieldLabel htmlFor={name} action={labelAction}>
        {label}
      </FieldLabel>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 transition-colors duration-150 start-4 ${
              invalid ? "text-red-400" : "text-muted"
            }`}
          />
        )}

        <input
          id={name}
          name={name}
          dir={dir}
          type={isPassword && reveal ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly={readOnly}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={`${inputClass({ invalid })} ${Icon ? "ps-11" : ""} ${
            isPassword ? "pe-11" : ""
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((value) => !value)}
            aria-label={reveal ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted transition-colors duration-150 hover:text-ink end-2.5"
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {invalid && <FieldError id={errorId}>{formik.errors[name]}</FieldError>}
    </div>
  );
}

export function TextAreaField({
  formik,
  name,
  label,
  rows = 5,
  placeholder,
  hint,
  maxLength,
  dir,
  className = "",
}) {
  const invalid = Boolean(formik.touched[name] && formik.errors[name]);

  const errorId = `${name}-error`;

  const hintId = hint ? `${name}-hint` : undefined;

  const value = formik.values[name] ?? "";

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={name} className="text-sm font-medium text-ink">
          {label}
        </label>

        {maxLength && (
          <span
            className={`tnum shrink-0 text-[11px] ${
              value.length > maxLength ? "text-red-600" : "text-muted"
            }`}
          >
            {value.length} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        id={name}
        name={name}
        dir={dir}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        aria-invalid={invalid}
        aria-describedby={
          [invalid ? errorId : null, hintId].filter(Boolean).join(" ") ||
          undefined
        }
        className={`${inputClass({ invalid, sized: false })} resize-y py-3 leading-7`}
      />

      {hint && !invalid && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}

      {invalid && <FieldError id={errorId}>{formik.errors[name]}</FieldError>}
    </div>
  );
}

export function SelectField({
  formik,
  name,
  label,
  icon: Icon,
  options = [],
  placeholder = "اختر",
  className = "",
}) {
  const invalid = Boolean(formik.touched[name] && formik.errors[name]);

  const errorId = `${name}-error`;

  return (
    <div className={className}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 ${
              invalid ? "text-red-400" : "text-muted"
            }`}
          />
        )}

        <select
          id={name}
          name={name}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={`${selectClass({ invalid })} ${Icon ? "ps-11" : ""}`}
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
        />
      </div>

      {invalid && <FieldError id={errorId}>{formik.errors[name]}</FieldError>}
    </div>
  );
}

export default TextField;
